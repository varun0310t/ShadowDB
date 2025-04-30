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

    // Get primary and replica nodes
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

    // Run PgPool container
    const cmd = `docker run -d \
      --name ${containerName} \
      --hostname ${containerName} \
      --network ${DB_CONFIG.networkName} \
      --network-alias=${containerName} \
      -v ${volumeName}:/etc/pgpool \
      -e PGPOOL_ADMIN_USERNAME=admin \
      -e PGPOOL_ADMIN_PASSWORD=${options.dbPassword} \
      -e PGPOOL_SR_CHECK_USER=${options.dbUser} \
      -e PGPOOL_SR_CHECK_PASSWORD=${options.dbPassword} \
      -e PGPOOL_HEALTH_CHECK_USER=${options.dbUser} \
      -e PGPOOL_HEALTH_CHECK_PASSWORD=${options.dbPassword} \
      -e PGPOOL_POSTGRES_USERNAME=${options.dbUser} \
      -e PGPOOL_POSTGRES_PASSWORD=${options.dbPassword} \
      -e PGPOOL_BACKEND_NODES="0:${primary.container_name}:5432,${replicas.map((r, idx) => `${idx + 1}:${r.container_name}:5432`).join(',')}" \
      -e PGPOOL_POSTGRES_HOSTS_0_HOST=${primary.container_name} \
      -e PGPOOL_POSTGRES_HOSTS_0_PORT=5432 \
      -e PGPOOL_POSTGRES_HOSTS_0_DATABASE=${options.databaseName} \
      -e PGPOOL_POSTGRES_HOSTS_0_USER=${options.dbUser} \
      -e PGPOOL_POSTGRES_HOSTS_0_PASSWORD=${options.dbPassword} \
      -e PGPOOL_PORT=9999 \
      -e PGPOOL_ENABLE_POOL_HBA=yes \
      -e PGPOOL_ENABLE_POOL_PASSWD=yes \
      -e PGPOOL_AUTHENTICATION_METHOD=md5 \
      -e PGPOOL_ENABLE_LOAD_BALANCING=${options.enableLoadBalancing ? 'yes' : 'no'} \
      -e PGPOOL_LOAD_BALANCE_MODE=${options.enableLoadBalancing ? 'yes' : 'no'} \
      -e PGPOOL_ENABLE_MEMQCACHE=${options.enableQueryCache ? 'yes' : 'no'} \
      -e PGPOOL_ENABLE_POOL_PASSFILE=yes \
      -e PGPOOL_PASSWD_ENCRYPTED_PASSWORD=yes \
      -e PGPOOL_EXTRA_FLAGS="--hba-file=/etc/pgpool/pool_hba.conf --trust-auth-method=md5" \
      -p ${port}:9999 \
      bitnami/pgpool:latest`;

    const { stdout } = await execAsync(cmd);
    const containerId = stdout.trim();

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
       (SELECT user_name FROM databases WHERE pgpool_id = p.id LIMIT 1) as db_user,
       (SELECT password FROM databases WHERE pgpool_id = p.id LIMIT 1) as db_password
       FROM pgpool_instances p WHERE id = $1`,
      [pgpoolId]
    );

    if (pgpoolRows.length === 0) {
      throw new Error(`PgPool instance with ID ${pgpoolId} not found`);
    }

    const pgpool = pgpoolRows[0];

    // Get all associated databases
    const { rows: dbRows } = await getDefaultReaderPool().query(
      `SELECT * FROM databases WHERE patroni_scope = $1 AND status = 'running'`,
      [pgpool.patroni_scope]
    );

    // Separate primary and replicas
    const primary = dbRows.find(db => !db.is_replica);
    const replicas = dbRows.filter(db => db.is_replica);

    if (!primary) {
      throw new Error(`No primary database found for PgPool ID ${pgpoolId}`);
    }

    // Update node list if needed
    if (options?.addNode) {
      console.log(`Adding node ${options.addNode.host} to PgPool configuration`);
      // We'll refresh from DB so no need to modify lists here
    }

    if (options?.removeNode) {
      console.log(`Removing node ${options.removeNode} from PgPool configuration`);
      // We'll refresh from DB so no need to modify lists here
    }

    // Generate updated configuration
    const pgpoolConfig = generatePgPoolConfig({
      primaryHost: primary.container_name,
      replicaHosts: replicas.map(r => r.container_name),
      databaseName: pgpool.db_name,
      dbUser: pgpool.db_user,
      dbPassword: pgpool.db_password,
      enableQueryCache: options?.enableQueryCache ?? pgpool.enable_query_cache,
      enableLoadBalancing: options?.enableLoadBalancing ?? pgpool.enable_load_balancing,
      enableConnectionPooling: options?.enableConnectionPooling ?? pgpool.enable_connection_pooling,
      numNodes: 1 + replicas.length
    });

    // Write configurations to temporary files
    const tempDir = path.join(os.tmpdir(), `pgpool-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const tempConfigPath = path.join(tempDir, "pgpool.conf");
    const tempHbaPath = path.join(tempDir, "pool_hba.conf");
    const tempPasswdPath = path.join(tempDir, "pool_passwd");

    fs.writeFileSync(tempConfigPath, pgpoolConfig.pgpoolConf);
    fs.writeFileSync(tempHbaPath, pgpoolConfig.poolHbaConf);
    fs.writeFileSync(tempPasswdPath, pgpoolConfig.poolPasswd);

    // Copy configurations to volume
    await execAsync(`docker run --rm -v ${pgpool.volume_name}:/etc/pgpool -v ${tempDir}:/tmp/config alpine sh -c "cp /tmp/config/* /etc/pgpool/ && chmod 644 /etc/pgpool/pgpool.conf /etc/pgpool/pool_hba.conf && chmod 600 /etc/pgpool/pool_passwd"`);

    // Clean up temporary files
    fs.rmSync(tempDir, { recursive: true, force: true });

    // Reload PgPool configuration (SIGHUP for reload)
    const reloadCmd = `docker exec ${pgpool.container_name} kill -SIGHUP 1`;
    await execAsync(reloadCmd);

    // Update database record if options changed
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
          options?.enableQueryCache ?? pgpool.enable_query_cache,
          options?.enableLoadBalancing ?? pgpool.enable_load_balancing,
          options?.enableConnectionPooling ?? pgpool.enable_connection_pooling,
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

function generatePgPoolConfig(options: {
  primaryHost: string;
  replicaHosts: string[];
  databaseName: string;
  dbUser: string;
  dbPassword: string;
  enableQueryCache: boolean;
  enableLoadBalancing: boolean;
  enableConnectionPooling: boolean;
  numNodes: number;
}): {
  pgpoolConf: string;
  poolHbaConf: string;
  poolPasswd: string;
} {
  // Build backend configuration
  let backendConfig = '';
  let hostList = [options.primaryHost, ...options.replicaHosts];

  for (let i = 0; i < hostList.length; i++) {
    backendConfig += `
# Configuration for node ${i} (${i === 0 ? 'Primary' : 'Replica'})
backend_hostname${i} = '${hostList[i]}'
backend_port${i} = 5432
backend_weight${i} = ${i === 0 ? 1 : 10}  # Weight for load balancing - higher for replicas
backend_data_directory${i} = '/var/lib/postgresql/data'
backend_flag${i} = 'ALLOW_TO_FAILOVER'
`;
  }

  // PgPool-II main configuration
  const pgpoolConf = `# pgpool.conf - PgPool-II configuration file

# Connection settings
listen_addresses = '*'
port = 9999
socket_dir = '/tmp'
listen_backlog_multiplier = 2
serialize_accept = off
reserved_connections = 0

# Backend nodes configuration
num_init_children = 32
max_pool = 4
child_life_time = 300
child_max_connections = 0
connection_life_time = 0
client_idle_limit = 0

# Backend health checking
health_check_period = 10
health_check_timeout = 20
health_check_user = '${options.dbUser}'
health_check_password = '${options.dbPassword}'
health_check_database = '${options.databaseName}'
health_check_max_retries = 3
health_check_retry_delay = 1
connect_timeout = 10000

# Authentication
enable_pool_hba = on
pool_passwd = 'pool_passwd'
authentication_timeout = 60

# Streaming replication configuration
sr_check_period = 10
sr_check_user = '${options.dbUser}'
sr_check_password = '${options.dbPassword}'
sr_check_database = '${options.databaseName}'
delay_threshold = 10000000

# Load balancing mode
load_balance_mode = ${options.enableLoadBalancing ? 'on' : 'off'}
${options.enableLoadBalancing ? `
black_function_list = ''
white_function_list = ''
black_query_pattern_list = ''
white_query_pattern_list = ''
database_redirect_preference_list = ''
app_name_redirect_preference_list = ''
allow_sql_comments = off
disable_load_balance_on_write = 'transaction'` : ''}

# Connection pooling
connection_cache = ${options.enableConnectionPooling ? 'on' : 'off'}
reset_query_list = 'ABORT; DISCARD ALL'
replicate_select = off

# Memory query cache
memory_cache_enabled = ${options.enableQueryCache ? 'on' : 'off'}
${options.enableQueryCache ? `
memqcache_method = 'shmem'
memqcache_expire = 60
memqcache_auto_cache_invalidation = on
memqcache_maxcache = 409600
memqcache_cache_block_size = 1048576
memqcache_oiddir = '/etc/pgpool/cache'
white_memqcache_table_list = ''
black_memqcache_table_list = ''` : ''}

# Logging
log_destination = 'stderr'
log_line_prefix = '%t: pid %p: '
log_connections = on
log_disconnections = off
log_hostname = on
log_statement = off
log_per_node_statement = off
log_client_messages = off
log_standby_delay = 'none'

${backendConfig}
`;

  // pool_hba.conf for client authentication
  const poolHbaConf = `# TYPE  DATABASE    USER        CIDR-ADDRESS          METHOD
local   all         all                               trust
host    all         all         127.0.0.1/32          md5
host    all         all         ::1/128               md5
host    all         all         0.0.0.0/0             md5
`;

  // pool_passwd for authentication
  // Note: In production, you would use a more secure method to generate this
  // This is just a placeholder that would need to be replaced with actual MD5 hashed password
  const poolPasswd = `${options.dbUser}:md5${require('crypto').createHash('md5').update(options.dbPassword + options.dbUser).digest('hex')}`;

  return {
    pgpoolConf,
    poolHbaConf,
    poolPasswd
  };
}