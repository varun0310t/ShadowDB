import { Request, Response } from "express";
import {
  createHAProxyInstance,
  updateHAProxyConfig,
} from "../lib/Haproxyutility";
const { exec } = require("child_process");
import { getDefaultReaderPool, getDefaultWriterPool } from "../lib/Getpools";
import { promisify } from "util";

const execAsync = promisify(exec);

export const CreateHaproxy = async (req: Request, res: Response) => {
  try {
    const { patroni_scope } = req.body;
    const dbinfo = await getDefaultReaderPool().query(
      `SELECT * FROM databases WHERE patroni_scope = $1`,
      [patroni_scope]
    );
    //get all databases primary and replicas info
    const primaryDatabases = dbinfo.rows.filter(
      (db) => db.is_replica === false
    );
    const replicaDatabases: any[] = dbinfo.rows.filter(
      (db) => db.is_replica === true
    );
    console.log(`Primary Databases: ${primaryDatabases.length}`);
    console.log(`Replica Databases: ${replicaDatabases.length}`);

    // Check if there are any primary databases
    if (primaryDatabases.length === 0) {
       res.status(400).json({
        message: "No primary databases found for the given patroni_scope",
      });
      return
    }

    //create haproxy instance

    const haproxyInstance = await createHAProxyInstance({
      clusterName: primaryDatabases[0].patroni_scope,
      patroniScope: primaryDatabases[0].patroni_scope,
      primaryContainerName: primaryDatabases[0].container_name,
      replicaContainerNames: replicaDatabases.map((db) => db.container_name),
    });

    res.status(200).json({
      message: "HAProxy instance created successfully",
      haproxyInstance,
    });
    return;
  } catch (error) {
    res.status(500).json({ message: "Error creating HAProxy", error });
  }
};

export const stopHaproxy = async (req: Request, res: Response) => {
  try {
    const { clusterName } = req.body;
    const haproxyinfo = await getDefaultReaderPool().query(
      `SELECT * FROM haproxy_instances WHERE container_name = $1`,
      [clusterName]
    );
    if (haproxyinfo.rows.length === 0) {
       res.status(404).json({ message: "HAProxy instance not found" });
       return;
    }
    const haproxy = haproxyinfo.rows[0];
    //stop haproxy instance
    const haproxyContainerName = haproxy.container_name;

    const cmdStop = `docker stop ${haproxyContainerName}`;

    // Execute the command to stop the HAProxy container
    await execAsync(cmdStop);

    // Update the status in the database
    await getDefaultWriterPool().query(
      `UPDATE haproxy_instances SET status = $1 WHERE container_name = $2`,
      ["stopped", haproxyContainerName]
    );

    console.log(`HAProxy instance ${haproxyContainerName} stopped`);
    res.status(200).json({
      message: "HAProxy instance stopped successfully",
      haproxy,
    });
  } catch (error) {
    res.status(500).json({ message: "Error stopping HAProxy", error });
  }
};

export const startHaproxy = async (req: Request, res: Response) => {
  try {
    const { clusterName } = req.body;
    const haproxyinfo = await getDefaultReaderPool().query(
      `SELECT * FROM haproxy_instances WHERE container_name = $1`,
      [clusterName]
    );
    if (haproxyinfo.rows.length === 0) {
       res.status(404).json({ message: "HAProxy instance not found" });
        return;
    }
    const haproxy = haproxyinfo.rows[0];
    //start haproxy instance
    const haproxyContainerName = haproxy.container_name;

    const cmdStart = `docker start ${haproxyContainerName}`;

    // Execute the command to start the HAProxy container
    await execAsync(cmdStart);

    // Update the status in the database
    await getDefaultWriterPool().query(
      `UPDATE haproxy_instances SET status = $1 WHERE container_name = $2`,
      ["running", haproxyContainerName]
    );

    console.log(`HAProxy instance ${haproxyContainerName} started`);
    res.status(200).json({
      message: "HAProxy instance started successfully",
      haproxy,
    });
  } catch (error) {
    res.status(500).json({ message: "Error starting HAProxy", error });
  }
};

export const deleteHaproxy = async (req: Request, res: Response) => {
  try {
    const { clusterName } = req.body;
    const haproxyinfo = await getDefaultReaderPool().query(
      `SELECT * FROM haproxy_instances WHERE container_name = $1`,
      [clusterName]
    );
    if (haproxyinfo.rows.length === 0) {
       res.status(404).json({ message: "HAProxy instance not found" });
        return;
    }
    const haproxy = haproxyinfo.rows[0];
    //delete haproxy instance
    const haproxyContainerName = haproxy.container_name;

    const cmdDelete = `docker rm -f ${haproxyContainerName}`;

    // Execute the command to delete the HAProxy container
    await execAsync(cmdDelete);

    // Update the status in the database
    await getDefaultWriterPool().query(
      `DELETE FROM haproxy_instances WHERE container_name = $1`,
      [haproxyContainerName]
    );

    console.log(`HAProxy instance ${haproxyContainerName} deleted`);
    res.status(200).json({
      message: "HAProxy instance deleted successfully",
      haproxy,
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting HAProxy", error });
  }
};
