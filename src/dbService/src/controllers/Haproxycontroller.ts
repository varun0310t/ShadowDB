import { Request, Response } from "express";
import {
  createHAProxyInstance,
  updateHAProxyConfig,
} from "../lib/Haproxyutility";
import { getDefaultReaderPool } from "../lib/Getpools";
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
      return res.status(400).json({
        message: "No primary databases found for the given patroni_scope",
      });
    }

    //create haproxy instance

    const haproxyInstance = await createHAProxyInstance({
      clusterName: primaryDatabases[0].patroni_scope,
      patroniScope: primaryDatabases[0].patroni_scope,
      primaryContainerName: primaryDatabases[0].container_name,
      replicaContainerNames: replicaDatabases.map((db) => db.container_name),
    });
    console.log("HAProxy instance created:", haproxyInstance);
 await getDefaultReaderPool().query(
      `INSERT INTO haproxy_instances 
       (container_name, container_id, write_port, read_port, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id`,
      [
        haproxyInstance.containerName,
        haproxyInstance.id,
        haproxyInstance.writePort,
        haproxyInstance.readPort,
        'running'
      ]
    ).then(async (result) => {
      const haproxyId = result.rows[0].id;
      
      // Update all databases in this Patroni scope with the HAProxy ID
      await getDefaultReaderPool().query(
        `UPDATE databases SET haproxy_id = $1 WHERE patroni_scope = $2`,
        [haproxyId, patroni_scope]
      );
    });
    res.status(200).json({
      message: "HAProxy instance created successfully",
      haproxyInstance,
    });
    return
  } catch (error) {
    res.status(500).json({ message: "Error creating HAProxy", error });
  }
};
