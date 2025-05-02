import { Request, Response } from "express";
import { getDefaultReaderPool, getDefaultWriterPool } from "../lib/Getpools";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

//route to update the contianer resource limit

export const updateContainerResourceLimit = async (
  req: Request,
  res: Response
) => {
  const { database_id, cpu_limit, memory_limit } = req.body;

  if (!database_id || !cpu_limit || !memory_limit) {
    res
      .status(400)
      .json({ error: "database_id, cpu_limit and memory_limit are required" });
    return;
  }

  // Get database info

  const { rows } = await getDefaultReaderPool().query(
    `SELECT d.id, d.name, d.container_name, d.password 
       FROM databases d
       WHERE d.id = $1`,
    [database_id]
  );
  if (rows.length === 0) {
    res
      .status(404)
      .json({ error: `Database with ID ${database_id} not found` });
    return;
  }
  const db = rows[0];

  const containerName = db.container_name;
  const password = db.password;

  //get replicas container name
  const replicas = await getDefaultReaderPool().query(
    `SELECT container_name FROM databases WHERE parent_id = $1`,
    [database_id]
  );

  // Update container resource limits using Docker command

  const updateCmd = `docker update --cpus=${cpu_limit} --memory=${memory_limit}m --memory=${memory_limit}m --memory-swap=${
    memory_limit * 2
  }m ${containerName}`;
  try {
    await execAsync(updateCmd);
  } catch (error) {
    console.error("Error updating container resource limits:", error);
    res
      .status(500)
      .json({ error: "Failed to update container resource limits" });
    return;
  }

  // Update replicas resource limits if any
  if (replicas.rows.length > 0) {
    for (const replica of replicas.rows) {
      const replicaContainerName = replica.container_name;
      const updateReplicaCmd = `docker update --cpus=${cpu_limit} --memory=${memory_limit}m --memory-swap=${
        memory_limit * 2
      }m ${replicaContainerName}`;
      try {
        await execAsync(updateReplicaCmd);
      } catch (error) {
        console.error(
          "Error updating replica container resource limits:",
          error
        );
        res.status(500).json({
          error: `Failed to update replica container resource limits for ${replicaContainerName}`,
        });
        return;
      }

      //update replicas database resource limits in our database
      await getDefaultWriterPool().query(
        "UPDATE databases SET cpu_limit = $1, memory_limit = $2 WHERE container_name = $3",
        [cpu_limit, memory_limit, replicaContainerName]
      );
      console.log(
        `Container resource limits updated successfully for replica ${replicaContainerName}`
      );
    }
  }

  // Update database resource limits in our database
  await getDefaultWriterPool().query(
    "UPDATE databases SET cpu_limit = $1, memory_limit = $2 WHERE id = $3",
    [cpu_limit, memory_limit, database_id]
  );
  res.status(200).json({
    message: `Container resource limits updated successfully for database ID ${database_id}`,
    cpu_limit,
    memory_limit,
  });
};
