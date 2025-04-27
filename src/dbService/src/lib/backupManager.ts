import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { getDefaultWriterPool } from "./Getpools";
import dotenv from "dotenv";
import StorageService from "../config/supabaseConfig";

dotenv.config();

const execAsync = promisify(exec);

// Environment configuration
const BACKUP_PATH = process.env.BACKUP_PATH || "C:\\PostgreSQL\\backups";
const DEFAULT_CONTAINER = process.env.POSTGRES_CONTAINER || "pg-1-default-1";
const DEFAULT_USER = process.env.POSTGRES_USER || "postgres";
const DEFAULT_PASSWORD = process.env.POSTGRES_PASSWORD;
const BACKUP_RETENTION_DAYS = parseInt(
  process.env.BACKUP_RETENTION_DAYS || "7",
  10
);

interface BackupResult {
  status: "success" | "failed";
  file: string;
  size: number;
  checksum: string;
  timestamp: string;
  containerName: string;
  databaseName: string;
  error?: string;
}

export enum BackupType {
  MANUAL = "manual",
  SCHEDULED = "scheduled",
  PRE_UPDATE = "pre_update",
}

export class BackupService {
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
    this.ensureBackupDirectory();
  }

  /**
   * Create a backup of the specified database
   * @param databaseId ID of the database to back up
   * @param backupType Type of backup (manual, scheduled, pre-update)
   * @param userId User requesting the backup
   */
  public async createBackup(
    databaseId: number,
    backupType: BackupType = BackupType.MANUAL,
    userId?: string
  ): Promise<number> {
    try {
      // Get database details from DB
      const { rows } = await getDefaultWriterPool().query(
        `SELECT d.*, 
                u.id as owner_id 
         FROM databases d
         JOIN users u ON d.owner_id = u.id
         WHERE d.id = $1`,
        [databaseId]
      );

      if (rows.length === 0) {
        throw new Error(`Database with ID ${databaseId} not found`);
      }

      const database = rows[0];
      const databaseName = database.name;
      const ownerId = database.owner_id;
      const requestingUserId = userId || ownerId;

      // For isolated databases, we need the container name
      const containerName =
        database.tenancy_type === "isolated"
          ? database.container_name
          : DEFAULT_CONTAINER;

      // For isolated databases, check if we should use a replica for the backup
      let useReplica = false;
      let replicaContainerName = null;

      if (database.tenancy_type === "isolated") {
        // Try to find a replica for this database
        const { rows: replicas } = await getDefaultWriterPool().query(
          `SELECT container_name 
           FROM databases 
           WHERE parent_id = $1 
           AND is_replica = true 
           AND status = 'running' 
           LIMIT 1`,
          [databaseId]
        );

        if (replicas.length > 0) {
          useReplica = true;
          replicaContainerName = replicas[0].container_name;
          console.log(
            `Using replica ${replicaContainerName} for backup of ${databaseName}`
          );
        }
      }

      // Create initial backup record
      const {
        rows: [backupRecord],
      } = await getDefaultWriterPool().query(
        `INSERT INTO backup_records
         (database_id, user_id, database_name, backup_type, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          databaseId,
          ownerId,
          databaseName,
          backupType,
          "in_progress",
          requestingUserId,
        ]
      );

      const backupId = backupRecord.id;

      try {
        // Execute backup
        const backupResult = await this.executeBackup(
          databaseName,
          useReplica ? replicaContainerName : containerName,
          database.tenancy_type,
          database.password || DEFAULT_PASSWORD,
          backupId
        );

        // Upload to storage (if successful)
        let storagePath = null;
        let storageUrl = null;

        if (backupResult.status === "success") {
          const storageResult = await this.storageService.uploadBackup(
            backupResult.file,
            ownerId.toString(),
            databaseName,
            backupId.toString()
          );

          storagePath = storageResult.path;
          storageUrl = storageResult.url;
        }

        // Update backup record
        await getDefaultWriterPool().query(
          `UPDATE backup_records
           SET status = $1,
               file_path = $2,
               file_name = $3,
               file_size = $4,
               checksum = $5,
               completed_at = $6,
               storage_path = $7,
               error_message = $8,
               metadata = $9
           WHERE id = $10`,
          [
            backupResult.status === "success" ? "completed" : "failed",
            backupResult.file,
            path.basename(backupResult.file),
            backupResult.size,
            backupResult.checksum,
            new Date(),
            storageUrl,
            backupResult.error || null,
            JSON.stringify({
              containerName: backupResult.containerName,
              useReplica: useReplica,
              timestamp: backupResult.timestamp,
            }),
            backupId,
          ]
        );

        // Clean up local file after successful upload
        if (backupResult.status === "success" && storagePath) {
          try {
            await fs.promises.unlink(backupResult.file);
            console.log(`Local backup file deleted: ${backupResult.file}`);
          } catch (unlinkError) {
            console.error(`Failed to delete local backup file: ${unlinkError}`);
          }
        }

        // Prune old backups
        await this.pruneOldBackups(databaseId);

        return backupId;
      } catch (backupError: any) {
        // Update backup record with error
        await getDefaultWriterPool().query(
          `UPDATE backup_records
           SET status = 'failed',
               error_message = $1,
               completed_at = $2
           WHERE id = $3`,
          [backupError.message, new Date(), backupId]
        );

        throw backupError;
      }
    } catch (error: any) {
      console.error(`Backup creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute the actual database backup
   */
  private async executeBackup(
    databaseName: string,
    containerName: string,
    tenancyType: string,
    password: string,
    backupId: number
  ): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `${databaseName}_${backupId}_${timestamp}.sql`;
    const backupFilePath = path.join(BACKUP_PATH, backupFileName);

    console.log(
      `Starting backup of ${databaseName} from container ${containerName}`
    );

    try {
      // Create the pg_dump command
      let pgDumpCmd = "";

      if (tenancyType === "isolated") {
        // For isolated databases, we execute pg_dump inside the container
        pgDumpCmd = `docker exec -e PGPASSWORD="${password}" ${containerName} pg_dump -U postgres -d ${databaseName} -f /tmp/${backupFileName} -v -c --if-exists`;

        // Execute pg_dump inside the container
        const { stdout, stderr } = await execAsync(
          pgDumpCmd.replace(password, "*******")
        );

        if (stderr && stderr.includes("error")) {
          throw new Error(`pg_dump error: ${stderr}`);
        }

        // Copy the backup file from container to host
        const copyCmd = `docker cp ${containerName}:/tmp/${backupFileName} "${backupFilePath}"`;
        await execAsync(copyCmd);

        // Remove the file from the container
        await execAsync(
          `docker exec ${containerName} rm /tmp/${backupFileName}`
        );
      } else {
        // For shared databases, use the Docker approach like isolated DBs
        pgDumpCmd = `docker exec -e PGPASSWORD='${password}' ${containerName} pg_dump  -U ${DEFAULT_USER} -d ${databaseName} -f /tmp/${backupFileName} -v -c --if-exists`;

        // Add -h 127.0.0.1 to force TCP instead of socket connection
        // pgDumpCmd = `docker exec -e PGPASSWORD="${password}" ${containerName} pg_dump -h 127.0.0.1 -U ${DEFAULT_USER} -d ${databaseName} -f /tmp/${backupFileName} -v -c --if-exists`;

        console.log(`Executing command: ${pgDumpCmd.replace(password, "*******")}`);

        // Execute pg_dump inside the container
        const { stdout, stderr } = await execAsync(
          pgDumpCmd.replace(password, "*******")
        );

        if (stderr && stderr.includes("error")) {
          throw new Error(`pg_dump error: ${stderr}`);
        }

        // Copy the backup file from container to host
        const copyCmd = `docker cp ${containerName}:/tmp/${backupFileName} "${backupFilePath}"`;
        await execAsync(copyCmd);

        // Remove the file from the container
        await execAsync(
          `docker exec ${containerName} rm /tmp/${backupFileName}`
        );
      }

      // Check if file exists and get its size
      const stats = await fs.promises.stat(backupFilePath);

      // Calculate checksum
      const fileBuffer = await fs.promises.readFile(backupFilePath);
      const checksum = crypto
        .createHash("md5")
        .update(fileBuffer)
        .digest("hex");

      return {
        status: "success",
        file: backupFilePath,
        size: stats.size,
        checksum,
        timestamp: timestamp,
        containerName,
        databaseName,
      };
    } catch (error: any) {
      console.error(`Backup execution failed: ${error.message}`);
      return {
        status: "failed",
        file: "",
        size: 0,
        checksum: "",
        timestamp: timestamp,
        containerName,
        databaseName,
        error: error.message,
      };
    }
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.promises.access(BACKUP_PATH, fs.constants.F_OK);
    } catch (error) {
      console.log(`Creating backup directory: ${BACKUP_PATH}`);
      await fs.promises.mkdir(BACKUP_PATH, { recursive: true });
    }
  }

  /**
   * Prune old backups based on retention policy
   */
  private async pruneOldBackups(databaseId: number): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS);

      // Get old backups that are completed and uploaded
      const { rows } = await getDefaultWriterPool().query(
        `SELECT id, storage_path, file_path
         FROM backup_records
         WHERE database_id = $1
         AND status = 'completed'
         AND created_at < $2
         AND storage_path IS NOT NULL`,
        [databaseId, cutoffDate]
      );

      if (rows.length === 0) {
        return;
      }

      console.log(
        `Found ${rows.length} old backups to prune for database ${databaseId}`
      );

      for (const backup of rows) {
        try {
          // Delete from storage
          if (backup.storage_path) {
            await this.storageService.deleteBackup(backup.storage_path);
          }

          // Delete local file if it still exists
          if (backup.file_path) {
            try {
              await fs.promises.access(backup.file_path, fs.constants.F_OK);
              await fs.promises.unlink(backup.file_path);
            } catch (fileError) {
              // File doesn't exist, that's fine
            }
          }

          // Update record status
          await getDefaultWriterPool().query(
            `UPDATE backup_records
             SET status = 'deleted',
                 deleted_at = $1
             WHERE id = $2`,
            [new Date(), backup.id]
          );

          console.log(`Pruned backup id: ${backup.id}`);
        } catch (pruneError) {
          console.error(`Failed to prune backup ${backup.id}: ${pruneError}`);
        }
      }
    } catch (error) {
      console.error(`Error pruning old backups: ${error}`);
    }
  }

  /**
   * List all backups for a database
   */
  public async listBackups(
    databaseId: number,
    limit = 50,
    offset = 0
  ): Promise<any[]> {
    const { rows } = await getDefaultWriterPool().query(
      `SELECT * FROM backup_records
       WHERE database_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [databaseId, limit, offset]
    );

    return rows;
  }

  /**
   * Get a backup's details
   */
  public async getBackup(backupId: number): Promise<any> {
    const { rows } = await getDefaultWriterPool().query(
      `SELECT * FROM backup_records WHERE id = $1`,
      [backupId]
    );

    if (rows.length === 0) {
      throw new Error(`Backup with ID ${backupId} not found`);
    }

    return rows[0];
  }

  /**
   * Backup all databases (used for scheduled backups)
   */
  public async backupAllDatabases(): Promise<{
    successful: number;
    failed: number;
  }> {
    let successful = 0;
    let failed = 0;

    try {
      // Get all active databases
      const { rows } = await getDefaultWriterPool().query(
        `SELECT id FROM databases 
         WHERE status = 'running'
         AND is_replica = false`
      );

      console.log(`Found ${rows.length} databases to back up`);

      for (const db of rows) {
        try {
          await this.createBackup(db.id, BackupType.SCHEDULED);
          successful++;
        } catch (error) {
          console.error(`Failed to back up database ${db.id}: ${error}`);
          failed++;
        }
      }

      return { successful, failed };
    } catch (error) {
      console.error(`Error in backupAllDatabases: ${error}`);
      throw error;
    }
  }
}

// Storage service for backups
