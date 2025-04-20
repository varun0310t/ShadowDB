import { getDefaultReaderPool ,getDefaultWriterPool} from "../lib/Getpools";
import { exec } from "child_process";
import { promisify } from "util";
import { DB_CONFIG } from "../config/DatabaseRouteConfig";
import { findAvailablePort } from "../lib/PortUitlity/utils";
import { Request, Response } from "express";
import { IsPatroniReady } from "../lib/PatroniUitlity/Uitls";

const execAsync = promisify(exec);

export const CreateDatabase = async (req: Request, res: Response) => {
  try {
    const { userId, databaseName, password } = req.body;

    if (!userId || !databaseName || !password) {
      res.status(400).json({
        error: "Missing required fields: userId, databaseName, password",
      });
      return; // Just return without a value
    }

    // Generate unique identifiers
    const containerName = `pg-${userId}-${databaseName}-${Date.now()}`;
    const volumeName = `pgdata-${userId}-${databaseName}`;
    const dbPort = await findAvailablePort(DB_CONFIG.basePort);
    const patroniPort = await findAvailablePort(DB_CONFIG.patroniBasePort);
    const patroniScope = `pg-${userId}-${databaseName}`;

    console.log(
      `Creating PostgreSQL instance with Patroni for user ${userId} with database ${databaseName} on port ${dbPort}`
    );

    // Create Docker volume
    await execAsync(`docker volume create ${volumeName}`);

    // Run Patroni-managed PostgreSQL container
    const cmd = `docker run -d \
      --name ${containerName} \
      --network ${DB_CONFIG.networkName} \
      -v ${volumeName}:${DB_CONFIG.volumeBasePath} \
      -e PATRONI_SCOPE=${patroniScope} \
      -e PATRONI_NAME=${containerName} \
      -e PATRONI_ETCD_URL=${DB_CONFIG.etcdUrl} \
      -e PATRONI_POSTGRESQL_LISTEN=0.0.0.0:5432 \
      -e PATRONI_POSTGRESQL_CONNECT_ADDRESS=${containerName}:5432 \
      -e PATRONI_POSTGRESQL_DATA_DIR=${DB_CONFIG.volumeBasePath} \
      -e PATRONI_SUPERUSER_USERNAME=postgres \
      -e PATRONI_SUPERUSER_PASSWORD=${password} \
      -e PATRONI_REPLICATION_USERNAME=replicator \
      -e PATRONI_REPLICATION_PASSWORD=${password} \
      -e PATRONI_POSTGRESQL_PARAMETERS_SHARED_BUFFERS=256MB \
      -e PATRONI_POSTGRESQL_PARAMETERS_MAX_CONNECTIONS=100 \
      -e PATRONI_POSTGRESQL_PARAMETERS_WAL_LEVEL=replica \
      -e PATRONI_POSTGRESQL_PARAMETERS_MAX_WAL_SENDERS=10 \
      -e PATRONI_POSTGRESQL_PARAMETERS_MAX_REPLICATION_SLOTS=10 \
      -e PATRONI_POSTGRESQL_PARAMETERS_HOT_STANDBY=on \
      -e PATRONI_RESTAPI_LISTEN=0.0.0.0:8008 \
      -e PATRONI_RESTAPI_CONNECT_ADDRESS=${containerName}:8008 \
      -p ${dbPort}:5432 \
      -p ${patroniPort}:8008 \
      ${DB_CONFIG.patroniImage}`;

    const { stdout } = await execAsync(cmd);
    const containerId = stdout.trim();

    // Save instance details to database with Patroni information
    const { rows } = await getDefaultWriterPool().query(
      `INSERT INTO databases (
        owner_id, name, container_name, container_id, 
        volume_name, port, status, password, patroni_scope, patroni_port
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        userId,
        databaseName,
        containerName,
        containerId,
        volumeName,
        dbPort,
        "creating",
        password,
        patroniScope,
        patroniPort,
      ]
    );

    const instanceId = rows[0].id;

    // Wait for PostgreSQL to be ready
    await IsPatroniReady(containerName, patroniPort);

    // Update status
    await getDefaultWriterPool().query(
      "UPDATE databases SET status = 'running' WHERE id = $1",
      [instanceId]
    );

    res.status(201).json({
      id: instanceId,
      userId,
      databaseName,
      containerName,
      port: dbPort,
      patroniPort,
      patroniScope,
      status: "running",
    });
  } catch (error) {
    console.error("Failed to create database instance:", error);
    res.status(500).json({ error: "Failed to create database instance" });
  }
};

export const AddReplica=async (req: Request, res: Response) => {
  try {
    const { databaseId } = req.body;

    // Get primary database info
    const { rows } = await getDefaultReaderPool().query(
      "SELECT * FROM databases WHERE id = $1",
      [databaseId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "Database not found" });
      return;
    }

    const primary = rows[0];
    const containerName = `pg-${primary.owner_id}-${
      primary.name
    }-replica-${Date.now()}`;
    const volumeName = `pgdata-${primary.owner_id}-${
      primary.name
    }-replica-${Date.now()}`;
    const dbPort = await findAvailablePort(DB_CONFIG.basePort);
    const patroniPort = await findAvailablePort(DB_CONFIG.patroniBasePort);

    // Create Docker volume
    await execAsync(`docker volume create ${volumeName}`);

    // Run Patroni-managed PostgreSQL replica
    const cmd = `docker run -d \
      --name ${containerName} \
      --network ${DB_CONFIG.networkName} \
      -v ${volumeName}:${DB_CONFIG.volumeBasePath} \
      -e PATRONI_SCOPE=${primary.patroni_scope} \
      -e PATRONI_NAME=${containerName} \
      -e PATRONI_ETCD_URL=${DB_CONFIG.etcdUrl} \
      -e PATRONI_POSTGRESQL_LISTEN=0.0.0.0:5432 \
      -e PATRONI_POSTGRESQL_CONNECT_ADDRESS=${containerName}:5432 \
      -e PATRONI_POSTGRESQL_DATA_DIR=${DB_CONFIG.volumeBasePath} \
      -e PATRONI_SUPERUSER_USERNAME=postgres \
      -e PATRONI_SUPERUSER_PASSWORD=${primary.password} \
      -e PATRONI_REPLICATION_USERNAME=replicator \
      -e PATRONI_REPLICATION_PASSWORD=${primary.password} \
      -e PATRONI_POSTGRESQL_PARAMETERS_SHARED_BUFFERS=256MB \
      -e PATRONI_POSTGRESQL_PARAMETERS_MAX_CONNECTIONS=100 \
      -e PATRONI_POSTGRESQL_PARAMETERS_WAL_LEVEL=replica \
      -e PATRONI_POSTGRESQL_PARAMETERS_MAX_WAL_SENDERS=10 \
      -e PATRONI_POSTGRESQL_PARAMETERS_MAX_REPLICATION_SLOTS=10 \
      -e PATRONI_POSTGRESQL_PARAMETERS_HOT_STANDBY=on \
      -e PATRONI_RESTAPI_LISTEN=0.0.0.0:8008 \
      -e PATRONI_RESTAPI_CONNECT_ADDRESS=${containerName}:8008 \
      -p ${dbPort}:5432 \
      -p ${patroniPort}:8008 \
      ${DB_CONFIG.patroniImage}`;

    const { stdout } = await execAsync(cmd);
    const containerId = stdout.trim();

    // Save replica details
    const { rows: replicaRows } = await getDefaultWriterPool().query(
      `INSERT INTO databases (
        owner_id, name, container_name, container_id, 
        volume_name, port, status, password, patroni_scope, patroni_port, parent_id, is_replica
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        primary.owner_id,
        primary.name,
        containerName,
        containerId,
        volumeName,
        dbPort,
        "creating",
        primary.password,
        primary.patroni_scope,
        patroniPort,
        primary.id,
        true,
      ]
    );

    // Wait for PostgreSQL to be ready
    await IsPatroniReady(containerName, patroniPort);

    // Update status
    await getDefaultWriterPool().query(
      "UPDATE databases SET status = 'running' WHERE id = $1",
      [replicaRows[0].id]
    );

    res.status(201).json({
      id: replicaRows[0].id,
      primaryId: primary.id,
      databaseName: primary.name,
      containerName,
      port: dbPort,
      patroniPort,
      patroniScope: primary.patroni_scope,
      status: "running",
      isReplica: true,
    });
  } catch (error) {
    console.error("Failed to create database replica:", error);
    res.status(500).json({ error: "Failed to create database replica" });
  }
}