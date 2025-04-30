import { exec } from "child_process";
import { promisify } from "util";
import { getDefaultReaderPool, getDefaultWriterPool } from "./Getpools";
import { findAvailablePort } from "./PortUitlity/utils";
import fs from "fs";
import path from "path";
import os from "os";
import { DB_CONFIG } from "../config/DatabaseRouteConfig";

const execAsync = promisify(exec);
const PGPOOL_CONFIG_DIR = process.env.PGPOOL_CONFIG_DIR || "./pgpool-configs";

// Ensure the config directory exists
if (!fs.existsSync(PGPOOL_CONFIG_DIR)) {
  fs.mkdirSync(PGPOOL_CONFIG_DIR, { recursive: true });
}

export interface PgPoolOptions {
  clusterName: string;
  databaseName: string;
  patroniScope: string;
  haproxyId: number;
  dbUser: string;
  dbPassword: string;
  enableQueryCache?: boolean;
  enableLoadBalancing?: boolean;
  enableConnectionPooling?: boolean;
}

export async function createPgPoolInstance(options: PgPoolOptions): Promise<{
  id: number;
  port: number;
  containerName: string;
}> {
  try {
    // Get HAProxy info
    const { rows: haproxyRows } = await getDefaultReaderPool().query(
      `SELECT * FROM haproxy_instances WHERE id = $1`,
      [options.haproxyId]
    );

    if (haproxyRows.length === 0) {
      throw new Error(`HAProxy with ID ${options.haproxyId} not found`);
    }

    const haproxy = haproxyRows[0];

    // Find available port
    const port = await findAvailablePort(9999);

    // Generate unique container name and volume name
    const containerName = `pgpool-${options.clusterName}-${Date.now()}`;
    const volumeName = `pgpool-config-${options.clusterName.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;

    console.log(`Creating PgPool-II config volume: ${volumeName}`);

    await execAsync(`docker volume create ${volumeName}`);

    // Get primary and replica nodes - we'll still get these for logging purposes
    const { rows: dbRows } = await getDefaultReaderPool().query(
      `SELECT * FROM databases WHERE patroni_scope = $1 AND status = 'running'`,
      [options.patroniScope]
    );

    const primary = dbRows.find(db => !db.is_replica);
    const replicas = dbRows.filter(db => db.is_replica);

    if (!primary) {
      throw new Error(`No primary database found for patroni scope ${options.patroniScope}`);
    }

    console.log(`Found primary ${primary.container_name} and ${replicas.length} replicas for PgPool configuration`);
    console.log(`Configuring PgPool to use HAProxy at ${haproxy.container_name} (write port: ${haproxy.write_port}, read port: ${haproxy.read_port})`);

    // First, get HAProxy's IP address for more reliable connections
    // Fixed: Proper quoting for the Docker inspect command
    const inspectCmd = `docker inspect --format="{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" ${haproxy.container_name}`;
    const { stdout: haproxyIp } = await execAsync(inspectCmd);
    const haproxyIpClean = haproxyIp.trim();

    console.log(`HAProxy IP address: ${haproxyIpClean}`);

    // Test direct connection to HAProxy to verify it's working
    try {
      console.log("Testing direct connection to HAProxy write endpoint...");
      const testCmd = `docker run --rm --network ${DB_CONFIG.networkName} postgres:15 psql "host=${haproxyIpClean} port=${haproxy.write_port} user=${options.dbUser} password=${options.dbPassword} dbname=${options.databaseName}" -c "SELECT version();"`;
      const { stdout: testResult } = await execAsync(testCmd);
      console.log("Connection test successful:", testResult);
    } catch (error) {
      console.warn("Connection test failed (will continue anyway):", error);
    }
    
    // Create pgpool_passwd file for authentication
    const tempDir = path.join(os.tmpdir(), `pgpool-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Create md5 hash of password+username
    const crypto = require('crypto');
    const md5Password = 'md5' + crypto.createHash('md5').update(options.dbPassword + options.dbUser).digest('hex');
    
    // Create pool_passwd file
    const poolPasswdPath = path.join(tempDir, 'pool_passwd');
    fs.writeFileSync(poolPasswdPath, `${options.dbUser}:${md5Password}`);
    
    // Create simplified pgpool.conf with just HAProxy connections
    const pgpoolConfPath = path.join(tempDir, 'pgpool.conf');
    const pgpoolConf = `
# Connection settings
listen_addresses = '*'
port = 9999
socket_dir = '/tmp'

# Backend configuration
backend_hostname0 = '${haproxyIpClean}'
backend_port0 = ${haproxy.write_port}
backend_weight0 = 1
backend_flag0 = 'ALLOW_TO_FAILOVER'

backend_hostname1 = '${haproxyIpClean}'
backend_port1 = ${haproxy.read_port}
backend_weight1 = 10
backend_flag1 = 'ALLOW_TO_FAILOVER'

# Load balancing
load_balance_mode = on


# Health check
health_check_period = 0
health_check_timeout = 0
health_check_user = '${options.dbUser}'
health_check_password = '${options.dbPassword}'
health_check_database = '${options.databaseName}'

# Logging - increase for debugging
log_connections = on
log_disconnections = on
log_error_verbosity = verbose
`;
console.log("PgPool configuration:", pgpoolConf);
    fs.writeFileSync(pgpoolConfPath, pgpoolConf);
    
    // Create pool_hba.conf
    const poolHbaPath = path.join(tempDir, 'pool_hba.conf');
    const poolHba = `
local   all         all                               trust
host    all         all         127.0.0.1/32          trust
host    all         all         ::1/128               trust
host    all         all         0.0.0.0/0             md5
`;
    fs.writeFileSync(poolHbaPath, poolHba);
    
    // Create Docker volume with the configuration files
    await execAsync(`docker run --rm -v ${volumeName}:/etc/pgpool -v ${tempDir}:/tmp alpine sh -c "cp /tmp/pool_passwd /etc/pgpool/ && cp /tmp/pgpool.conf /etc/pgpool/ && cp /tmp/pool_hba.conf /etc/pgpool/ && chmod 600 /etc/pgpool/pool_passwd"`);
    
    // Remove temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });

    // Run PgPool container with simplified configuration using volume mount
    const cmd = `docker run -d \
      --name ${containerName} \
      --hostname ${containerName} \
      --network ${DB_CONFIG.networkName} \
      --network-alias=${containerName} \
      -v ${volumeName}:/etc/pgpool2 \
      -p ${port}:9999 \
      -e PGPOOL_PARAMS_PORT=9999 \
      -e PGPOOL_PARAMS_LISTEN_ADDRESSES=* \
      -e PGPOOL_PARAMS_SOCKET_DIR=/tmp \
      -e PGPOOL_PARAMS_BACKEND_HOSTNAME0=${haproxyIpClean} \
      -e PGPOOL_PARAMS_BACKEND_PORT0=${haproxy.write_port} \
      -e PGPOOL_PARAMS_BACKEND_WEIGHT0=1 \
      -e PGPOOL_PARAMS_BACKEND_FLAG0=ALLOW_TO_FAILOVER \
      -e PGPOOL_PARAMS_BACKEND_HOSTNAME1=${haproxyIpClean} \
      -e PGPOOL_PARAMS_BACKEND_PORT1=${haproxy.read_port} \
      -e PGPOOL_PARAMS_BACKEND_WEIGHT1=10 \
      -e PGPOOL_PARAMS_BACKEND_FLAG1=ALLOW_TO_FAILOVER \
      -e PGPOOL_PARAMS_LOAD_BALANCE_MODE=on \
      -e PGPOOL_PARAMS_HEALTH_CHECK_PERIOD=10 \
      -e PGPOOL_PARAMS_HEALTH_CHECK_TIMEOUT=20 \
      -e PGPOOL_PARAMS_HEALTH_CHECK_USER=${options.dbUser} \
      -e PGPOOL_PARAMS_HEALTH_CHECK_PASSWORD=${options.dbPassword} \
      -e PGPOOL_PARAMS_HEALTH_CHECK_DATABASE=${options.databaseName} \
      -e PGPOOL_PARAMS_HEALTH_CHECK_MAX_RETRIES=3 \
      -e PGPOOL_PARAMS_HEALTH_CHECK_RETRY_DELAY=1 \
      -e PGPOOL_PARAMS_CONNECT_TIMEOUT=10000 \
      -e PGPOOL_PARAMS_CLIENT_IDLE_LIMIT=0 \
      -e PGPOOL_PARAMS_LOG_CONNECTIONS=on \
      -e PGPOOL_PARAMS_LOG_DISCONNECTIONS=on \
      -e PGPOOL_PARAMS_LOG_ERROR_VERBOSITY=verbose \
      -e PGPOOL_PARAMS_CONNECTION_CACHE=on \
      -e PGPOOL_PARAMS_NUM_INIT_CHILDREN=100 \
      -e PGPOOL_PARAMS_MAX_POOL=4 \
      -e POOL_PASSWD=${options.dbPassword} \
      -e POSTGRES_USERNAME=${options.dbUser} \
      -e POSTGRES_PASSWORD=${options.dbPassword} \
      -e POSTGRES_DB=${options.databaseName} \
      pgpool/pgpool:latest`;

    const { stdout } = await execAsync(cmd);
    const containerId = stdout.trim();

    console.log(`PgPool container started with ID: ${containerId}`);

    // Wait a bit for PgPool to initialize
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check PgPool logs
    const logsCmd = `docker logs ${containerName}`;
    try {
      const { stdout: logs } = await execAsync(logsCmd);
      console.log("PgPool startup logs:", logs);
    } catch (error) {
      console.warn("Failed to get PgPool logs:", error);
    }

    // No need to copy configs since we're using environment variables directly
    // Try directly connecting to test if PgPool is working
    try {
      console.log("Testing PgPool's connection to HAProxy...");
      const testCmd = `docker exec ${containerName} psql -U ${options.dbUser} -h ${haproxyIpClean} -p ${haproxy.write_port} -d ${options.databaseName} -c "SELECT version();"`;
      const { stdout: testResult } = await execAsync(testCmd);
      console.log("PgPool → HAProxy connection test successful:", testResult);
    } catch (error) {
      console.warn("PgPool → HAProxy connection test failed:", error);
    }

    // Save instance details to database
    const { rows } = await getDefaultWriterPool().query(
      `INSERT INTO pgpool_instances (
        cluster_name, port, container_name, container_id, 
        volume_name, status, haproxy_id, 
        enable_query_cache, enable_load_balancing, enable_connection_pooling
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        options.clusterName,
        port,
        containerName,
        containerId,
        volumeName,
        "running",
        options.haproxyId,
        options.enableQueryCache ?? true,
        options.enableLoadBalancing ?? true,
        options.enableConnectionPooling ?? true
      ]
    );

    const pgpoolId = rows[0].id;

    // Update all databases with this patroni_scope to use this PgPool
    await getDefaultWriterPool().query(
      `UPDATE databases SET pgpool_id = $1 WHERE patroni_scope = $2`,
      [pgpoolId, options.patroniScope]
    );

    return {
      id: pgpoolId,
      port,
      containerName
    };
  } catch (error) {
    console.error("Failed to create PgPool-II instance:", error);
    throw new Error(`Failed to create PgPool-II instance: ${error}`);
  }
}

export async function updatePgPoolConfig(
  pgpoolId: number,
  options?: {
    addNode?: { host: string, isReplica: boolean },
    removeNode?: string,
    enableQueryCache?: boolean,
    enableLoadBalancing?: boolean,
    enableConnectionPooling?: boolean
  }
): Promise<boolean> {
  try {
    // Get PgPool instance info
    const { rows: pgpoolRows } = await getDefaultReaderPool().query(
      `SELECT p.*, 
       (SELECT patroni_scope FROM databases WHERE pgpool_id = p.id LIMIT 1) as patroni_scope,
       (SELECT name FROM databases WHERE pgpool_id = p.id LIMIT 1) as db_name,
       (SELECT password FROM databases WHERE pgpool_id = p.id LIMIT 1) as db_password
       FROM pgpool_instances p WHERE id = $1`,
      [pgpoolId]
    );

    if (pgpoolRows.length === 0) {
      throw new Error(`PgPool instance with ID ${pgpoolId} not found`);
    }

    // For PgPool with HAProxy backend, node changes don't need configuration changes
    // since HAProxy manages the backend nodes
    console.log("PgPool configuration updated - HAProxy handles node changes automatically");

    // We only need to update settings in the database
    if (options?.enableQueryCache !== undefined || 
        options?.enableLoadBalancing !== undefined ||
        options?.enableConnectionPooling !== undefined) {
      await getDefaultWriterPool().query(
        `UPDATE pgpool_instances SET 
         enable_query_cache = $1, 
         enable_load_balancing = $2,
         enable_connection_pooling = $3,
         updated_at = NOW()
         WHERE id = $4`,
        [
          options?.enableQueryCache ?? pgpoolRows[0].enable_query_cache,
          options?.enableLoadBalancing ?? pgpoolRows[0].enable_load_balancing,
          options?.enableConnectionPooling ?? pgpoolRows[0].enable_connection_pooling,
          pgpoolId
        ]
      );
    }

    return true;
  } catch (error) {
    console.error("Failed to update PgPool configuration:", error);
    return false;
  }
}