import { getDefaultReaderPool, getDefaultWriterPool } from "../lib/Getpools";
import net from "net";
import { exec } from "child_process";
import { promisify } from "util";
import { DB_CONFIG } from "../config/DatabaseRouteConfig";
import { findAvailablePort } from "../lib/PortUitlity/utils";

const execAsync = promisify(exec);

export async function initializeService() {
  try {
    console.log("Initializing database service and recovering instances...");

    // Ensure Docker network exists
    try {
      await execAsync(`docker network inspect ${DB_CONFIG.networkName}`);
      console.log(`Docker network ${DB_CONFIG.networkName} exists`);
    } catch (error) {
      console.log(`Creating Docker network ${DB_CONFIG.networkName}...`);
      await execAsync(`docker network create ${DB_CONFIG.networkName}`);
    }

    // Get all instances from management database that should be running
    const { rows: instances } = await getDefaultReaderPool().query(
      "SELECT * FROM databases WHERE status != 'deleted' AND status != 'hibernated'"
    );
    if (instances.length === 0) {
      console.log("No database instances to recover");
      return;
    }
    console.log(`Found ${instances.length} database instances to recover`);

    // Get currently running containers
    const { stdout: runningContainersOutput } = await execAsync(
      "docker ps --format '{{.Names}}'"
    );
    const runningContainers = runningContainersOutput
      .split("\n")
      .filter(Boolean);

    // Recover each instance
    for (const instance of instances) {
      try {
        const isRunning = runningContainers.includes(instance.container_name);

        if (isRunning) {
          console.log(
            `Container ${instance.container_name} is already running`
          );
          continue;
        }

        // Check if container exists but is stopped
        try {
          await execAsync(`docker inspect ${instance.container_name}`);
          console.log(
            `Starting existing container ${instance.container_name}...`
          );
          await execAsync(`docker start ${instance.container_name}`);
        } catch (containerError) {
          // Container doesn't exist, recreate it
          console.log(`Recreating container ${instance.container_name}...`);

          // Recreate with Patroni
          const patroniScope =
            instance.patroni_scope ||
            `pg-${instance.owner_id}-${instance.name}`;
          const patroniPort =
            instance.patroni_port ||
            (await findAvailablePort(DB_CONFIG.patroniBasePort));

          // Run Patroni container
          const cmd = `docker run -d \
            --name ${instance.container_name} \
            --network ${DB_CONFIG.networkName} \
            -v ${instance.volume_name}:${DB_CONFIG.volumeBasePath} \
            -e PATRONI_SCOPE=${patroniScope} \
            -e PATRONI_NAME=${instance.container_name} \
            -e PATRONI_ETCD_URL=${DB_CONFIG.etcdUrl} \
            -e PATRONI_POSTGRESQL_LISTEN=0.0.0.0:5432 \
            -e PATRONI_POSTGRESQL_CONNECT_ADDRESS=${instance.container_name}:5432 \
            -e PATRONI_POSTGRESQL_DATA_DIR=${DB_CONFIG.volumeBasePath} \
            -e PATRONI_SUPERUSER_USERNAME=postgres \
            -e PATRONI_SUPERUSER_PASSWORD=${instance.password} \
            -e PATRONI_REPLICATION_USERNAME=replicator \
            -e PATRONI_REPLICATION_PASSWORD=${instance.password} \
            -e PATRONI_POSTGRESQL_PARAMETERS_SHARED_BUFFERS=256MB \
            -e PATRONI_POSTGRESQL_PARAMETERS_MAX_CONNECTIONS=100 \
            -e PATRONI_POSTGRESQL_PARAMETERS_WAL_LEVEL=replica \
            -e PATRONI_POSTGRESQL_PARAMETERS_MAX_WAL_SENDERS=10 \
            -e PATRONI_POSTGRESQL_PARAMETERS_MAX_REPLICATION_SLOTS=10 \
            -e PATRONI_POSTGRESQL_PARAMETERS_HOT_STANDBY=on \
            -e PATRONI_RESTAPI_LISTEN=0.0.0.0:8008 \
            -e PATRONI_RESTAPI_CONNECT_ADDRESS=${instance.container_name}:8008 \
            -p ${instance.port}:5432 \
            -p ${patroniPort}:8008 \
            ${DB_CONFIG.patroniImage}`;

          await execAsync(cmd);

          // Update Patroni info if it was missing
          if (!instance.patroni_scope) {
            await getDefaultWriterPool().query(
              "UPDATE databases SET patroni_scope = $1, patroni_port = $2 WHERE id = $3",
              [patroniScope, patroniPort, instance.id]
            );
          }
        }

        // Update instance status
        await getDefaultWriterPool().query(
          "UPDATE databases SET status = 'running', last_started_at = NOW() WHERE id = $1",
          [instance.id]
        );

        console.log(
          `Successfully recovered instance ${instance.container_name}`
        );
      } catch (instanceError: any) {
        console.error(
          `Failed to recover instance ${instance.container_name}:`,
          instanceError
        );

        // Update instance status to error
        await getDefaultWriterPool().query(
          "UPDATE databases SET status = 'error', error_message = $1 WHERE id = $2",
          [instanceError.message, instance.id]
        );
      }
    }

    console.log("Database service initialization complete");
  } catch (error) {
    console.error("Failed to initialize database service:", error);
  }
}
