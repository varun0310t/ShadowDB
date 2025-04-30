import { exec } from "child_process";
import { promisify } from "util";
import { getDefaultReaderPool, getDefaultWriterPool } from "./Getpools";
import { findAvailablePort } from "./PortUitlity/utils";
import { DB_CONFIG } from "../config/DatabaseRouteConfig";

const execAsync = promisify(exec);

export interface QueryCacherOptions {
  clusterName: string;
  haproxyId: number;
  cacheSize?: string;
  ttl?: number;
  dbName: string;
  dbPassword: string;
}

export async function createQueryCacherInstance(options: QueryCacherOptions): Promise<{
  id: number;
  port: number;
  containerName: string;
}> {
  try {
    // Get HAProxy information
    const { rows: haproxyRows } = await getDefaultReaderPool().query(
      "SELECT * FROM haproxy_instances WHERE id = $1",
      [options.haproxyId]
    );

    if (haproxyRows.length === 0) {
      throw new Error(`HAProxy with ID ${options.haproxyId} not found`);
    }

    const haproxy = haproxyRows[0];

    // Find available port
    const port = await findAvailablePort(30000); // Start at port 30000 for QueryCachers

    // Generate unique container name
    const containerName = `querycacher-${options.clusterName}-${Date.now()}`;

    // Run QueryCacher container
    const cmd = `docker run -d \
      --name ${containerName} \
      --hostname ${containerName} \
      --network ${DB_CONFIG.networkName} \
      --network-alias=${containerName} \
      -e QC_POSTGRES_URL=postgresql://postgres:${options.dbPassword}@${haproxy.container_name}:${haproxy.port}/${options.dbName} \
      -e QC_CACHE_SIZE=${options.cacheSize || '256MB'} \
      -e QC_DEFAULT_TTL=${options.ttl || 60} \
      -e QC_LOG_LEVEL=info \
      -p ${port}:5432 \
      pgcacher/querycacher:latest`;

    const { stdout } = await execAsync(cmd);
    const containerId = stdout.trim();

    // Save instance details to database
    const { rows } = await getDefaultWriterPool().query(
      `INSERT INTO querycacher_instances (
        cluster_name, port, container_name, container_id, 
        status, cache_size, ttl, haproxy_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        options.clusterName,
        port,
        containerName,
        containerId,
        "running",
        options.cacheSize || '256MB',
        options.ttl || 60,
        options.haproxyId,
      ]
    );

    const querycacherId = rows[0].id;

    // Update all databases with this haproxy_id to use this QueryCacher
    await getDefaultWriterPool().query(
      `UPDATE databases SET querycacher_id = $1 WHERE haproxy_id = $2`,
      [querycacherId, options.haproxyId]
    );

    return {
      id: querycacherId,
      port,
      containerName,
    };
  } catch (error) {
    console.error("Failed to create QueryCacher instance:", error);
    throw new Error(`Failed to create QueryCacher instance: ${error}`);
  }
}