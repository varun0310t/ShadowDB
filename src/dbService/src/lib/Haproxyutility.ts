import { exec } from "child_process";
import { promisify } from "util";
import { getDefaultReaderPool, getDefaultWriterPool } from "./Getpools";
import { findAvailablePort } from "./PortUitlity/utils";
import fs from "fs";
import path from "path";
import { DB_CONFIG } from "../config/DatabaseRouteConfig";
import os from "os";
const execAsync = promisify(exec);
const HAPROXY_CONFIG_DIR =
  process.env.HAPROXY_CONFIG_DIR || "./haproxy-configs";

// Ensure the config directory exists
if (!fs.existsSync(HAPROXY_CONFIG_DIR)) {
  fs.mkdirSync(HAPROXY_CONFIG_DIR, { recursive: true });
}

export interface HAProxyOptions {
  clusterName: string;
  patroniScope: string;
  primaryContainerName: string;
  replicaContainerNames?: string[];
}

export async function createHAProxyInstance(options: HAProxyOptions): Promise<{
  id: number;
  writePort: number; // Explicit naming
  readPort: number; // Include both ports
  containerName: string;
}> {
  try {
    // Find available ports - separate ports for read and write
    const writePort = await findAvailablePort(10000); // Start at port 10000 for writes
    const readPort = await findAvailablePort(20000); // Start at port 20000 for reads
    const statsPort = await findAvailablePort(8400); // For HAProxy stats

    // Generate unique container name and volume name
    const containerName = `haproxy-${options.clusterName}-${Date.now()}`;
    const volumeName = `haproxy-config-${options.clusterName.replace(
      /[^a-zA-Z0-9_.-]/g,
      "_"
    )}`;

    console.log(`Creating HAProxy config volume: ${volumeName}`);

    // Create Docker volume
    await execAsync(`docker volume create ${volumeName}`);

    // Generate HAProxy configuration
    const config = generateHAProxyConfig({
      clusterName: options.clusterName,
      primaryContainerName: options.primaryContainerName,
      replicaContainerNames: options.replicaContainerNames || [],
      writePort,
      readPort,
      statsPort,
    });

    // Create a temporary file for the configuration
    const tempConfigPath = path.join(os.tmpdir(), `haproxy-${Date.now()}.cfg`);
    fs.writeFileSync(tempConfigPath, config);

    // Copy configuration to the Docker volume
    await execAsync(
      `docker run --rm -v ${volumeName}:/config -v ${tempConfigPath}:/temp.cfg alpine cp /temp.cfg /config/haproxy.cfg`
    );

    // Remove temporary file
    fs.unlinkSync(tempConfigPath);

    // Run HAProxy container
    const cmd = `docker run -d \
      --name ${containerName} \
      --hostname ${containerName} \
      --network ${DB_CONFIG.networkName} \
      --network-alias=${containerName} \
      -v ${volumeName}:/usr/local/etc/haproxy \
      -p ${writePort}:${writePort} \
      -p ${readPort}:${readPort} \
      -p ${statsPort}:${statsPort} \
      haproxy:2.8`;

    const { stdout } = await execAsync(cmd);
    const containerId = stdout.trim();

    // Save instance details to database with separate read and write ports
    const { rows } = await getDefaultWriterPool().query(
      `INSERT INTO haproxy_instances (
        cluster_name, write_port, read_port, container_name, 
        container_id, volume_name, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        options.clusterName,
        writePort,
        readPort,
        containerName,
        containerId,
        volumeName,
        "running",
      ]
    );

    const haproxyId = rows[0].id;

    // Update all databases with this patroni_scope to use this HAProxy
    await getDefaultWriterPool().query(
      `UPDATE databases SET haproxy_id = $1 WHERE patroni_scope = $2`,
      [haproxyId, options.patroniScope]
    );

    return {
      id: haproxyId,
      writePort: writePort, // Use explicit port names
      readPort: readPort,
      containerName,
    };
  } catch (error) {
    console.error("Failed to create HAProxy instance:", error);
    throw new Error(`Failed to create HAProxy instance: ${error}`);
  }
}

export async function updateHAProxyConfig(
  haproxyId: number,
  options?: {
    addReplica?: string;
    removeReplica?: string;
  }
): Promise<boolean> {
  try {
    // Get HAProxy instance info
    const { rows: haproxyRows } = await getDefaultReaderPool().query(
      `SELECT h.*, 
       (SELECT patroni_scope FROM databases WHERE haproxy_id = h.id LIMIT 1) as patroni_scope
       FROM haproxy_instances h WHERE id = $1`,
      [haproxyId]
    );

    if (haproxyRows.length === 0) {
      throw new Error(`HAProxy instance with ID ${haproxyId} not found`);
    }

    const haproxy = haproxyRows[0];

    // Get all associated databases
    const { rows: dbRows } = await getDefaultReaderPool().query(
      `SELECT * FROM databases WHERE patroni_scope = $1 AND status = 'running'`,
      [haproxy.patroni_scope]
    );

    // Separate primary and replicas
    const primary = dbRows.find((db) => !db.is_replica);
    const replicas = dbRows.filter((db) => db.is_replica);

    if (!primary) {
      throw new Error(`No primary database found for HAProxy ID ${haproxyId}`);
    }

    // Update replica list if needed
    if (options?.addReplica) {
      const replicaExists = replicas.some(
        (r) => r.container_name === options.addReplica
      );
      if (!replicaExists) {
        console.log(
          `Adding replica ${options.addReplica} to HAProxy configuration`
        );
        // No need to modify the replicas array as we'll refresh from DB
      }
    }

    if (options?.removeReplica) {
      console.log(
        `Removing replica ${options.removeReplica} from HAProxy configuration`
      );
      // No need to modify the replicas array as we'll refresh from DB
    }

    // Generate updated configuration
    const configFilePath = path.join(
      HAPROXY_CONFIG_DIR,
      `${haproxy.cluster_name}.cfg`
    );
    const config = generateHAProxyConfig({
      clusterName: haproxy.cluster_name,
      primaryContainerName: primary.container_name,
      replicaContainerNames: replicas.map((r) => r.container_name),
      writePort: haproxy.write_port,  // Fix: Use write_port
      readPort: haproxy.read_port,    // Fix: Use read_port
      statsPort: 8404, // Default stats port
    });

    fs.writeFileSync(configFilePath, config);

    // Reload HAProxy configuration
    const reloadCmd = `docker exec ${haproxy.container_name} kill -SIGUSR2 1`;
    await execAsync(reloadCmd);

    return true;
  } catch (error) {
    console.error("Failed to update HAProxy configuration:", error);
    return false;
  }
}

function generateHAProxyConfig(options: {
  clusterName: string;
  primaryContainerName: string;
  replicaContainerNames: string[];
  writePort: number;
  readPort: number;
  statsPort: number;
}): string {
  console.log(options.replicaContainerNames, "replicaContainerNames");
  return `
global
    maxconn 1000
    log stdout format raw local0

defaults
    log global
    mode tcp
    retries 2
    timeout client 30m
    timeout connect 4s
    timeout server 30m
    timeout check 5s

listen stats
    mode http
    bind *:${options.statsPort}
    stats enable
    stats uri /
    stats refresh 10s
    stats admin if TRUE

# Write port - Always routes to primary (for writes)
frontend ${options.clusterName}_write_frontend
    bind *:${options.writePort}
    mode tcp
    default_backend ${options.clusterName}_write_backend

# Read port - Routes to replicas when available (for reads)
frontend ${options.clusterName}_read_frontend
    bind *:${options.readPort}
    mode tcp
    default_backend ${options.clusterName}_read_backend

# Primary backend for write operations
backend ${options.clusterName}_write_backend
    mode tcp
    option pgsql-check user postgres
    default-server inter 3s fall 3 rise 2 on-marked-down shutdown-sessions
    server ${options.primaryContainerName} ${
    options.primaryContainerName
  }:5432 check
${options.replicaContainerNames
  .map((replica) => `    server ${replica} ${replica}:5432 check backup`)
  .join("\n")}

# Replica backend for read operations
backend ${options.clusterName}_read_backend
    mode tcp
    option pgsql-check user postgres
    default-server inter 3s fall 3 rise 2 on-marked-down shutdown-sessions
${
  options.replicaContainerNames.length > 0
    ? options.replicaContainerNames
        .map((replica) => `    server ${replica} ${replica}:5432 check`)
        .join("\n")
    : `    server ${options.primaryContainerName} ${options.primaryContainerName}:5432 check`
}
${
  options.replicaContainerNames.length > 0
    ? `    server ${options.primaryContainerName} ${options.primaryContainerName}:5432 check backup`
    : ""
}
`;
}
