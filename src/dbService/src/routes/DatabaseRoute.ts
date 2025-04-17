import { exec } from "child_process";
import { promisify } from "util";
import "../config/psqlConfig";
import * as fs from "fs";
import * as path from "path";
import { getDefaultReaderPool, getDefaultWriterPool } from "../lib/Getpools"; // Fix import to match your project structure
import express, { Router, Request, Response } from "express"; // Fix import with correct types
const execAsync = promisify(exec);
const router = Router();

// Configuration
const DB_CONFIG = {
  basePort: 5567, // Starting port for PostgreSQL instances
  networkName: "shadowdb-network", // Docker network name
  volumeBasePath: "/var/lib/postgresql/data", // Base path for volumes
  postgresImage: "postgres:15-alpine", // Docker image to use
};

// Database connection for the management database

// Initialize and recover instances on service startup
(async function initializeService() {
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

          // Run PostgreSQL container
          const cmd = `docker run -d \
            --name ${instance.container_name} \
            --network ${DB_CONFIG.networkName} \
            -v ${instance.volume_name}:${DB_CONFIG.volumeBasePath} \
            -e POSTGRES_PASSWORD=${instance.password} \
            -e POSTGRES_DB=${instance.name} \
            -p ${instance.port}:5432 \
            ${DB_CONFIG.postgresImage}`;

          await execAsync(cmd);
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
    // In a production environment, you might want to exit the process or implement retries
  }
})();

// Regular routes - Fix the route handler type signatures
router.get("/", (req: Request, res: Response) => {
  res.send("Database Route");
});

// Create a new database instance
router.post("/create", async (req: Request, res: Response) => {
  try {
    const { userId, databaseName, password } = req.body;

    if (!userId || !databaseName || !password) {
      res.status(400).json({
        error: "Missing required fields: userId, databaseName, password",
      });
      return; // Just return without a value
    }

    // Generate unique identifiers
    const containerName = `pg-${userId}-${Date.now()}`;
    const volumeName = `pgdata-${userId}-${databaseName}`;
    const port = await findAvailablePort(DB_CONFIG.basePort);

    // Create Docker volume
    await execAsync(`docker volume create ${volumeName}`);

    // Run PostgreSQL container
    const cmd = `docker run -d \
      --name ${containerName} \
      --network ${DB_CONFIG.networkName} \
      -v ${volumeName}:${DB_CONFIG.volumeBasePath} \
      -e POSTGRES_PASSWORD=${password} \
      -e POSTGRES_DB=${databaseName} \
      -p ${port}:5432 \
      ${DB_CONFIG.postgresImage}`;

    const { stdout } = await execAsync(cmd);
    const containerId = stdout.trim();

    // Save instance details to database
    const { rows } = await getDefaultWriterPool().query(
      `INSERT INTO databases (
        owner_id, name, container_name, container_id, 
        volume_name, port, status, created_at, password
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8) RETURNING id`,
      [
        userId,
        databaseName,
        containerName,
        containerId,
        volumeName,
        port,
        "creating",
        password,
      ]
    );

    const instanceId = rows[0].id;

    // Wait for PostgreSQL to be ready
    await waitForPostgresReady(containerName, password);

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
      port,
      status: "running",
    });
  } catch (error) {
    console.error("Failed to create database instance:", error);
    res.status(500).json({ error: "Failed to create database instance" });
  }
});

// Helper functions
async function findAvailablePort(startPort: number): Promise<number> {
  try {
    // Get all used ports from database
    const { rows } = await getDefaultReaderPool().query(
      "SELECT port FROM databases"
    );
    const usedPorts = new Set(rows.map((row) => row.port));

    // Find an available port
    let port = startPort;
    while (usedPorts.has(port)) {
      port++;
    }

    return port;
  } catch (error) {
    console.error("Error finding available port:", error);
    // Fallback to random port as a last resort
    return startPort + Math.floor(Math.random() * 1000);
  }
}

async function waitForPostgresReady(
  containerName: string,
  password: string
): Promise<void> {
  let retries = 30;
  const checkCmd = `docker exec ${containerName} pg_isready -U postgres`;

  while (retries > 0) {
    try {
      await execAsync(checkCmd);
      return;
    } catch (error) {
      retries--;
      if (retries === 0) throw new Error("PostgreSQL failed to start");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

export default router;
