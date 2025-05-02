import { Request, Response } from "express";
import { getDefaultReaderPool, getDefaultWriterPool } from "../lib/Getpools";
import { checkDatabaseSize } from "../lib/StorageChecker";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Get storage information for a database
 * @route GET /api/databases/:databaseId/storage
 */
export const GetStorageInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { databaseId } = req.params;
  const { rows } = await getDefaultReaderPool().query(
    `SELECT d.id, d.name, d.container_name, d.max_size_mb, d.password, 
            d.status, d.read_only, u.id as user_id, u.email as user_email 
     FROM databases d
     JOIN users u ON d.owner_id = u.id
     WHERE d.id = $1`,
    [databaseId]
  );

  if (rows.length === 0) {
    res.status(404).json({ error: `Database with ID ${databaseId} not found` });
    return;
  }

  const db = rows[0];

  const currentSizeMB = db.current_size_mb || 0;
  const maxSizeMB = db.max_size_mb || 512;
  const usagePercent = ((currentSizeMB / maxSizeMB) * 100).toFixed(2);
  const exceeded = currentSizeMB > maxSizeMB;

  const status = exceeded ? "exceeded" : db.status;
  const statusMessage = exceeded
    ? "Storage limit exceeded"
    : db.status_message || "OK";

  res.status(200).json({
    id: db.id,
    name: db.name,
    currentSizeMB,
    maxSizeMB,
    usagePercent,
    exceeded,
    status,
    statusMessage,
  });
};

///update database max size
export const UpdateDatabaseMaxSize = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { databaseId, userId, new_max_size } = req.body;

  const { rows } = await getDefaultReaderPool().query(
    `SELECT d.id, d.name, d.container_name, d.max_size_mb, d.password, 
                d.status, d.read_only, u.id as user_id, u.email as user_email 
         FROM databases d
         JOIN users u ON d.owner_id = u.id
         WHERE d.id = $1`,
    [databaseId]
  );

  if (rows.length === 0) {
    res.status(404).json({ error: `Database with ID ${databaseId} not found` });
    return;
  }

  const db = rows[0];

  // Check if the user is the owner of the database
  if (db.user_id !== userId) {
    res
      .status(403)
      .json({ error: "You do not have permission to update this database" });
    return;
  }

  // Update the max size in the database
  await getDefaultWriterPool().query(
    "UPDATE databases SET max_size_mb = $1 WHERE id = $2",
    [new_max_size, databaseId]
  );

  res.status(200).json({ message: "Database max size updated successfully" });
};

//off the read only mode if the size is under the limit now

export const OffReadOnlyMode = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { databaseId } = req.params;
  const { rows } = await getDefaultReaderPool().query(
    `SELECT d.id, d.name, d.container_name, d.max_size_mb, d.password, 
            d.status, d.read_only, u.id as user_id, u.email as user_email 
     FROM databases d
     JOIN users u ON d.owner_id = u.id
     WHERE d.id = $1`,
    [databaseId]
  );

  if (rows.length === 0) {
    res.status(404).json({ error: `Database with ID ${databaseId} not found` });
    return;
  }

  const db = rows[0];

  // Get current database size
  const sizeCmd = `docker exec -e PGPASSWORD="${db.password}" ${db.container_name} psql -U postgres -t -c "SELECT pg_database_size('${db.name}') / 1024 / 1024 AS size_mb;"`;
  const { stdout } = await execAsync(sizeCmd);
  const currentSizeMB = parseFloat(stdout.trim());

  // Update our database with the current size
  await getDefaultWriterPool().query(
    "UPDATE databases SET current_size_mb = $1, last_size_check = NOW() WHERE id = $2",
    [currentSizeMB, databaseId]
  );

  // Check if the database is in read-only mode and if the size is under the limit now
  if (db.read_only && currentSizeMB < db.max_size_mb) {
    console.log(
      `Database ${db.name} (ID: ${db.id}) is now under the storage limit. Turning off read-only mode.`
    );

    try {
      // Set database to read-write mode
      const readWriteCmd = `docker exec -e PGPASSWORD="${db.password}" ${db.container_name} psql -U postgres -c "ALTER DATABASE \\\"${db.name}\\\" SET default_transaction_read_only = off;"`;
      await execAsync(readWriteCmd);

      // Update status in our database
      await getDefaultWriterPool().query(
        "UPDATE databases SET read_only = false, status = 'active', status_message = 'Storage limit back to normal' WHERE id = $1",
        [databaseId]
      );
    } catch (error) {
      console.error(
        `Failed to set database ${db.id} to read-write mode:`,
        error
      );
      res
        .status(500)
        .json({ error: "Failed to set database to read-write mode" });
      return;
    }
  }
  res
    .status(200)
    .json({ message: "Database read-only mode turned off successfully" });
};
