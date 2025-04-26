import { getDefaultReaderPool, getDefaultWriterPool } from "../lib/Getpools";
import { exec } from "child_process";
import { promisify } from "util";
import { DB_CONFIG } from "../config/DatabaseRouteConfig";
import { findAvailablePort } from "../lib/PortUitlity/utils";
import { Request, Response } from "express";
import { IsPatroniReady } from "../lib/PatroniUitlity/Uitls";
import axios from "axios";
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
    console.log(password);
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
      --hostname ${containerName} \
      --network ${DB_CONFIG.networkName} \
      --network-alias=${containerName} \
      -v ${volumeName}:${DB_CONFIG.volumeBasePath} \
      -e PATRONI_NAMESPACE=shadowdb \
      -e PATRONI_SCOPE=${patroniScope} \
      -e PATRONI_NAME=${containerName} \
      -e PATRONI_ETCD_URL=http://etcd:2379 \
      -e PATRONI_POSTGRESQL_LISTEN=0.0.0.0:5432 \
      -e PATRONI_POSTGRESQL_CONNECT_ADDRESS=${containerName}:5432 \
      -e PATRONI_POSTGRESQL_DATA_DIR=${DB_CONFIG.volumeBasePath} \
      -e PATRONI_SUPERUSER_USERNAME=postgres \
      -e PATRONI_SUPERUSER_PASSWORD=${password} \
      -e PATRONI_REPLICATION_USERNAME=replicator \
      -e PATRONI_REPLICATION_PASSWORD=${password} \
      -e PATRONI_POSTGRESQL_PARAMETERS_WAL_LEVEL=replica \
      -e PATRONI_POSTGRESQL_PARAMETERS_MAX_WAL_SENDERS=10 \
      -e PATRONI_POSTGRESQL_PARAMETERS_MAX_REPLICATION_SLOTS=10 \
      -e PATRONI_POSTGRESQL_PARAMETERS_HOT_STANDBY=on \
      -e PATRONI_POSTGRESQL_PARAMETERS_wal_keep_size=1GB \
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
    // create a database in the new instance
    console.log(
      `PostgreSQL instance ${containerName} is ready. Creating database ${databaseName}`
    );
    //add one replica to the primary instance by calling the addreplica endpoint
    try {
      console.log(`Automatically creating a replica for database ${databaseName} (ID: ${instanceId})...`);
      
      // Create a mock request and response for calling AddReplica directly
      const mockReq = {
        body: {
          databaseId: instanceId
        }
      } as Request;
      
      let replicaResponse: any = null;
      
      const mockRes = {
        status: (code: number) => {
          return {
            json: (data: any) => {
              console.log(`Replica creation completed with status ${code}`);
              replicaResponse = data;
              return data;
            }
          };
        }
      } as unknown as Response;
      
      // Call AddReplica directly without creating a new HTTP request
      await AddReplica(mockReq, mockRes);
      
      if (replicaResponse && replicaResponse.id) {
        console.log(`Successfully created replica with ID: ${replicaResponse.id}`);
        console.log(`Replica is running on port: ${replicaResponse.port}`);
      } else {
        console.warn("Replica creation did not return expected response");
      }
    } catch (error) {
      console.error(`Failed to create replica: ${error instanceof Error ? error.message : String(error)}`);
      // Continue execution even if replica creation fails
      console.log("Continuing without replica - it can be added later manually");
    }
    // Create the database with timeout protection
    try {
      // Add a timeout wrapper around execAsync
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Command timed out after 15 seconds")),
          15000
        );
      });

      const createDbCmd = `docker exec -e PGPASSWORD="${password}" ${containerName} psql -U postgres postgres -c "CREATE DATABASE ${databaseName} TEMPLATE template0;"`;

      // Race between the command and the timeout
      const result: any = await Promise.race([
        execAsync(createDbCmd),
        timeoutPromise,
      ]);

      console.log(`Database created: ${result.stdout}`);
    } catch (error: any) {
      console.error(`Failed to create database: ${error} ${error.message}`);
      // Continue execution even if database creation fails
    }

    console.log(
      `PostgreSQL instance ${containerName} is ready. Moving past database creation.`
    );
    // Check if PostgreSQL is ready
    // After IsPatroniReady but before updating status
    try {
      const logsCmd = `docker logs ${containerName} | grep -E "basebackup|replication|slot"`;
      const { stdout: logs } = await execAsync(logsCmd);
      console.log("Relevant PostgreSQL logs:", logs);
    } catch (error) {
      console.error("Failed to check logs:", error);
    }

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

export const AddReplica = async (req: Request, res: Response) => {
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

    // Get primary IP address using the simpler template approach
    let primaryIPAddress;
    try {
      // Use a simpler Docker inspect command that works without jq
      const primaryIPCmd = `docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" ${primary.container_name}`;
      const { stdout: primaryIP } = await execAsync(primaryIPCmd);
      primaryIPAddress = primaryIP.trim();

      console.log(`Primary IP address: ${primaryIPAddress}`);

      if (!primaryIPAddress) {
        throw new Error(
          `Could not get IP address for container ${primary.container_name}`
        );
      }
    } catch (error) {
      console.error("Failed to get primary IP address:", error);
      res
        .status(500)
        .json({ error: "Failed to get primary database IP address" });
      return;
    }

    console.log(`Primary IP address: ${primaryIPAddress}`);

    // Before creating the replica, create a replication slot on primary
    try {
      const slotName = containerName.replace(/-/g, "_");
      const createSlotCmd = `docker exec ${primary.container_name} psql -U postgres -c "SELECT pg_create_physical_replication_slot('${slotName}');"`;
      const { stdout: slotResult } = await execAsync(createSlotCmd);
      console.log(`Created replication slot: ${slotResult}`);
    } catch (error) {
      console.error("Failed to create replication slot:", error);
    }

    // Before creating a new slot, check if any slots already exist
    try {
      const checkSlotsCmd = `docker exec ${primary.container_name} psql -U postgres -c "SELECT slot_name FROM pg_replication_slots;"`;
      const { stdout: existingSlots } = await execAsync(checkSlotsCmd);
      console.log(`Existing replication slots: ${existingSlots}`);
    } catch (error) {
      console.error("Failed to check existing slots:", error);
    }

    // Add before creating the replica
    try {
      const replicationPermissionCmd = `docker exec ${primary.container_name} psql -U postgres -c "SELECT rolreplication FROM pg_roles WHERE rolname='replicator';"`;
      const { stdout: permissionCheck } = await execAsync(
        replicationPermissionCmd
      );
      console.log(`Replication permission check: ${permissionCheck}`);

      if (!permissionCheck.includes("t")) {
        console.log("Fixing replication permissions...");
        await execAsync(
          `docker exec ${primary.container_name} psql -U postgres -c "ALTER ROLE replicator WITH REPLICATION;"`
        );
      }
    } catch (error) {
      console.error("Failed to check replication permissions:", error);
    }

    // Create Docker volume
    await execAsync(`docker volume create ${volumeName}`);

    // Define the slot name once to ensure consistency
    const slotName = containerName.replace(/-/g, "_");

    // Create replica with dynamic IP address
    const cmd = `docker run -d \
      --name ${containerName} \
      --hostname ${containerName} \
      --network ${DB_CONFIG.networkName} \
      --network-alias=${containerName} \
      --add-host ${primary.container_name}:${primaryIPAddress} \
      -v ${volumeName}:${DB_CONFIG.volumeBasePath} \
      -e PATRONI_NAMESPACE=shadowdb \
      -e PATRONI_SCOPE=${primary.patroni_scope} \
      -e PATRONI_NAME=${containerName} \
      -e PATRONI_ETCD_URL=http://etcd:2379 \
      -e PATRONI_POSTGRESQL_LISTEN=0.0.0.0:5432 \
      -e PATRONI_POSTGRESQL_CONNECT_ADDRESS=${containerName}:5432 \
      -e PATRONI_POSTGRESQL_DATA_DIR=${DB_CONFIG.volumeBasePath} \
      -e PATRONI_SUPERUSER_USERNAME=postgres \
      -e PATRONI_SUPERUSER_PASSWORD=${primary.password} \
      -e PATRONI_REPLICATION_USERNAME=replicator \
      -e PATRONI_REPLICATION_PASSWORD=${primary.password} \
      -e PATRONI_STANDBY_CLUSTER=true \
      -e PATRONI_STANDBY_LEADER=false \
      -e "PATRONI_POSTGRESQL_RECOVERY_CONF_primary_slot_name=${slotName}" \
      -e "PATRONI_POSTGRESQL_RECOVERY_CONF_primary_conninfo=host=${primaryIPAddress} port=5432 user=replicator password=${primary.password}" \
      -e PATRONI_BOOTSTRAP_METHOD=replica_method \
      -e "PATRONI_REPLICA_METHOD=basebackup" \
      -e "PATRONI_BASEBACKUP_OPTIONS=--verbose --progress -h ${primaryIPAddress} -p 5432 -U replicator" \
      -e PATRONI_RESTAPI_LISTEN=0.0.0.0:8008 \
      -e PATRONI_RESTAPI_CONNECT_ADDRESS=${containerName}:8008 \
      -p ${dbPort}:5432 \
      -p ${patroniPort}:8008 \
      ${DB_CONFIG.patroniImage}`;

    const { stdout } = await execAsync(cmd);
    const containerId = stdout.trim();

    // Add this after creating the replica container but before IsPatroniReady
    try {
      // Wait a bit for container to initialize
      console.log("Waiting 3 seconds for container to initialize...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Check if replica can access etcd
      const etcdCheckCmd = `docker exec ${containerName} curl -s http://etcd:2379/version`;
      const { stdout: etcdCheck } = await execAsync(etcdCheckCmd);
      console.log(`Replica etcd access check: ${etcdCheck}`);

      // Check if replica can access primary
      const primaryCheckCmd = `docker exec ${containerName} pg_isready -h ${primary.container_name} -p 5432 -U replicator`;
      try {
        const { stdout: primaryCheck } = await execAsync(primaryCheckCmd);
        console.log(`Primary connection check: ${primaryCheck}`);
      } catch (error) {
        console.error(`Cannot connect to primary: ${error}`);
      }
    } catch (error) {
      console.error("Failed to check connectivity:", error);
    }

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

    // Wait for PostgreSQL to be ready with improved timeout
    await IsPatroniReady(containerName, patroniPort, true);

    // Update status
    await getDefaultWriterPool().query(
      "UPDATE databases SET status = 'running' WHERE id = $1",
      [replicaRows[0].id]
    );

    // Check cluster status
    try {
      const { stdout: clusterStatus } = await execAsync(
        `docker exec ${containerName} curl -s http://localhost:8008/cluster`
      );
      console.log("Cluster status:", clusterStatus);
    } catch (error) {
      console.error("Failed to check cluster status:", error);
    }

    // Check if primary is visible to replica
    const pingPrimaryCmd = `docker exec ${containerName} ping -c 1 ${primary.container_name}`;
    try {
      const { stdout: pingOutput } = await execAsync(pingPrimaryCmd);
      console.log(`Primary connectivity check: ${pingOutput}`);
    } catch (error) {
      console.error(`Cannot ping primary: ${error}`);
    }

    // Check replication status
    const replicationStatusCmd = `docker exec ${containerName} psql -U postgres -c "SELECT * FROM pg_stat_replication;"`;
    try {
      const { stdout: replicationStatus } = await execAsync(
        replicationStatusCmd
      );
      console.log(`Replication status: ${replicationStatus}`);
    } catch (error) {
      console.error(`Failed to check replication status: ${error}`);
    }

    // After creating both containers, check Patroni's replication config
    try {
      const patroniConfigCmd = `docker exec ${containerName} curl -s http://localhost:8008/config`;
      const { stdout: patroniConfig } = await execAsync(patroniConfigCmd);
      console.log(`Patroni config on replica: ${patroniConfig}`);

      const primaryPatroniConfigCmd = `docker exec ${primary.container_name} curl -s http://localhost:8008/config`;
      const { stdout: primaryPatroniConfig } = await execAsync(
        primaryPatroniConfigCmd
      );
      console.log(`Patroni config on primary: ${primaryPatroniConfig}`);
    } catch (error) {
      console.error("Failed to check Patroni config:", error);
    }

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
};
