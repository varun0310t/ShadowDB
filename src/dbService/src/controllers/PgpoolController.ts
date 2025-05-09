import { Request, Response } from "express";
import { createPgPoolInstance, updatePgPoolConfig } from "../lib/pgpoolUtility";
import { getDefaultReaderPool, getDefaultWriterPool } from "../lib/Getpools";
import { promisify } from "util";
const { exec } = require("child_process");

const execAsync = promisify(exec);

export const createPgpool = async (req: Request, res: Response) => {
  try {
    const { database_id, haproxy_id, userID } = req.body;

    // Validate required parameters
    if (!database_id || !haproxy_id) {
       res.status(400).json({
        success: false,
        message: "Missing required parameters: database_id and haproxy_id",
      });
      return;
    }

    // Get the database information
    const dbInfo = await getDefaultReaderPool().query(
      `SELECT * FROM databases WHERE id = $1`,
      [database_id]
    );

    if (dbInfo.rows.length === 0) {
       res.status(404).json({
        success: false,
        message: "Database not found",
      });
      return;
    }

    // Get HAProxy information
    const haproxyInfo = await getDefaultReaderPool().query(
      `SELECT * FROM haproxy_instances WHERE id = $1`,
      [haproxy_id]
    );

    if (haproxyInfo.rows.length === 0) {
       res.status(404).json({
        success: false,
        message: "HAProxy instance not found",
      });
      return;
    }

    const database = dbInfo.rows[0];
    const haproxy = haproxyInfo.rows[0];

    //get userinfo
    const userInfo = await getDefaultReaderPool().query(
      `SELECT * FROM users WHERE id = $1`,
      [userID]
    );
    if (userInfo.rows.length === 0) {
       res.status(404).json({
        success: false,
        message: "User not found",
      });
        return;
    }
    const user = userInfo.rows[0];
    console.log("User info:", user);

    // Create PgPool instance
    const pgpoolInstance = await createPgPoolInstance({
      clusterName: database.patroni_scope,
      databaseName: database.name,
      dbUser: user.email,
      dbPassword: user.role_password,
      haproxyId: haproxy.id,
      patroniScope: database.patroni_scope,
      enableQueryCache: true,
      enableLoadBalancing: true,
      enableConnectionPooling: true,
    });

    console.log("PgPool instance created:", pgpoolInstance);

    res.status(200).json({
      success: true,
      message: "PgPool instance created successfully",
      pgpoolInstance,
    });
  } catch (error) {
    console.error("Error creating PgPool instance:", error);
    res.status(500).json({
      success: false,
      message: "Error creating PgPool",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const stopPgpool = async (req: Request, res: Response) => {
  try {
    const { clusterName } = req.body;

    // Validate required parameters
    if (!clusterName) {
       res.status(400).json({
        success: false,
        message: "Missing required parameter: clusterName",
      });
        return;
    }

    // Check if PgPool exists
    const pgpoolInfo = await getDefaultReaderPool().query(
      `SELECT * FROM pgpool_instances WHERE cluster_name = $1`,
      [clusterName]
    );

    if (pgpoolInfo.rows.length === 0) {
       res.status(404).json({
        success: false,
        message: "PgPool instance not found",
      });
      return;
    }

    // Stop the PgPool container
    const cmdStop = `docker stop ${pgpoolInfo.rows[0].container_name}`;
    await execAsync(cmdStop);

    // Update the status in the database
    await getDefaultWriterPool().query(
      `UPDATE pgpool_instances SET status = $1 WHERE cluster_name = $2`,
      ["stopped", pgpoolInfo.rows[0].cluster_name]
    );

    console.log(`PgPool instance ${pgpoolInfo.rows[0].cluster_name} stopped`);

    res.status(200).json({
      success: true,
      message: "PgPool instance stopped successfully",
      pgpool: pgpoolInfo.rows[0],
    });
    return
  } catch (error) {
    console.error("Error stopping PgPool instance:", error);
    res.status(500).json({
      success: false,
      message: "Error stopping PgPool",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const startPgpool = async (req: Request, res: Response) => {
  try {
    const { clusterName } = req.body;

    // Validate required parameters
    if (!clusterName) {
       res.status(400).json({
        success: false,
        message: "Missing required parameter: clusterName",
      });
      
      return;
    }

    // Check if PgPool exists
    const pgpoolInfo = await getDefaultReaderPool().query(
      `SELECT * FROM pgpool_instances WHERE cluster_name = $1`,
      [clusterName]
    );

    if (pgpoolInfo.rows.length === 0) {
       res.status(404).json({
        success: false,
        message: "PgPool instance not found",
      });
      return;
    }

    // Start the PgPool container
    const cmdStart = `docker start ${pgpoolInfo.rows[0].container_name}`;
    await execAsync(cmdStart);

    // Update the status in the database
    await getDefaultWriterPool().query(
      `UPDATE pgpool_instances SET status = $1 WHERE cluster_name = $2`,
      ["running", pgpoolInfo.rows[0].cluster_name]
    );

    console.log(`PgPool instance ${pgpoolInfo.rows[0].cluster_name} started`);

    res.status(200).json({
      success: true,
      message: "PgPool instance started successfully",
      pgpool: pgpoolInfo.rows[0],
    });
  } catch (error) {
    console.error("Error starting PgPool instance:", error);
    res.status(500).json({
      success: false,
      message: "Error starting PgPool",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const deletePgpool = async (req: Request, res: Response) => {
  try {
    const { clusterName } = req.body;

    // Validate required parameters
    if (!clusterName) {
       res.status(400).json({
        success: false,
        message: "Missing required parameter: clusterName",
      });
      return;
    }

    // Check if PgPool exists
    const pgpoolInfo = await getDefaultReaderPool().query(
      `SELECT * FROM pgpool_instances WHERE cluster_name = $1`,
      [clusterName]
    );

    if (pgpoolInfo.rows.length === 0) {
       res.status(404).json({
        success: false,
        message: "PgPool instance not found",
      });
      return;
    }

    const pgpool = pgpoolInfo.rows[0];

    // Remove the PgPool container
    const cmdRemove = `docker rm -f ${pgpool.container_name}`;
    await execAsync(cmdRemove);

    // Optionally remove the volume if needed
    if (pgpool.volume_name) {
      try {
        const cmdRemoveVolume = `docker volume rm ${pgpool.volume_name}`;
        await execAsync(cmdRemoveVolume);
        console.log(`Removed PgPool volume: ${pgpool.volume_name}`);
      } catch (volError) {
        console.warn(
          `Warning: Could not remove volume ${pgpool.volume_name}`,
          volError
        );
      }
    }

    // Update any databases that use this PgPool instance
    await getDefaultWriterPool().query(
      `UPDATE databases SET pgpool_id = NULL WHERE pgpool_id = $1`,
      [pgpool.id]
    );

    // Delete the PgPool record from the database
    await getDefaultWriterPool().query(
      `DELETE FROM pgpool_instances WHERE cluster_name = $1`,
      [pgpool.cluster_name]
    );

    console.log(`PgPool instance ${pgpool.cluster_name} deleted`);

    res.status(200).json({
      success: true,
      message: "PgPool instance deleted successfully",
      pgpool,
    });
  } catch (error) {
    console.error("Error deleting PgPool instance:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting PgPool",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
