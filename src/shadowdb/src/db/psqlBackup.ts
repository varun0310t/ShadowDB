import SupaBaseClient from "@/lib/SupaBaseClient";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { getDefaultReaderPool, getDefaultWriterPool } from "@/lib/userPools";
import { checkAndUpdateLeader } from "@/lib/LeaderCheck";
const execAsync = promisify(exec);

interface BackupResult {
  status: "Success" | "Failed";
  file: string;
  size: string;
  checksum: string;
  timestamp: string;
  container?: string;
  error?: string;
}

export class BackupManager {
  private supabaseStorage;
  private backupPath: string;
  private containerName: string;

  constructor() {
    this.supabaseStorage = SupaBaseClient.storage;
    this.backupPath = process.env.BACKUP_PATH || "C:\\PostgreSQL\\backups";
    this.containerName =
      process.env.POSTGRES_CONTAINER || "docker-patroni_primary-1";
  }

  async createBackup(userId: string, databaseName: string): Promise<number> {
    try {
      if (process.env.NODE_ENV !== "production") {
        await checkAndUpdateLeader();
        console.log("Leader check completed.");
      }
 //
      // Create initial backup record
      const {
        rows: [backupRecord],
      } = await getDefaultWriterPool().query(
        `INSERT INTO backup_records
         (user_id, database_name, backup_type, status, storage_location, created_by, file_name, file_path, storage_path)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          userId,
          databaseName,
          "manual",
          "in_progress",
          "supabase",
          userId,
          "pending.sql",
          "pending",
          "pending",
        ]
      );

      // Execute PowerShell backup script
      const backupResult = await this.executeBackupScript(databaseName);

      // Upload to Supabase Storage
      const storageFile = await this.uploadToStorage(backupResult.file, userId);

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
             metadata = $8,
             error_message = $9
         WHERE id = $10`,
        [
          backupResult.status === "Success" ? "completed" : "failed",
          storageFile.path,
          path.basename(backupResult.file),
          backupResult.size,
          backupResult.checksum,
          new Date(),
          storageFile.publicUrl,
          JSON.stringify(backupResult),
          backupResult.error,
          backupRecord.id,
        ]
      );

      // Clean up local file
      await fs.promises.unlink(backupResult.file);

      return backupRecord.id;
    } catch (error) {
      console.error("Backup failed:", error);
      throw error;
    }
  }

  private async executeBackupScript(
    databaseName: string
  ): Promise<BackupResult> {
    try {
      const scriptPath =
        "C:\\Users\\Varun\\Desktop\\repos\\ShadowDB\\scripts\\backup-database.ps1";

      // Get password from environment variable
      const password = process.env.POSTGRES_PASSWORD;
      if (!password) {
        throw new Error("Database password not configured");
      }

      console.log("Executing backup script...");

      // Use direct command format with proper argument passing
      const command = `powershell -NonInteractive -File "${scriptPath}" -DatabaseName "${databaseName}" -BackupPath "${this.backupPath}" -ContainerName "${this.containerName}" -Password "${password}"`;

      console.log("Command:", command.replace(password, "*****"));

      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        console.error("Backup script stderr:", stderr);
        throw new Error(stderr);
      }

      console.log("Backup script stdout:", stdout);

      try {
        // Clean the output to ensure it's valid JSON
        // PowerShell might add new lines or other characters
        const cleanedOutput = stdout.trim().replace(/\r?\n/g, "");

        // Log the cleaned output
        console.log("Cleaned output:", cleanedOutput);

        // Try to parse it as JSON
        const result = JSON.parse(cleanedOutput) as BackupResult;

        // Verify the file exists before proceeding
        if (result.file) {
          try {
            await fs.promises.access(result.file, fs.constants.F_OK);
            console.log(`Backup file verified at: ${result.file}`);
          } catch (fileErr) {
            console.error(`Backup file not found at: ${result.file}`);
            throw new Error(`Backup file not found: ${result.file}`);
          }
        } else {
          throw new Error("Backup file path is missing from script output");
        }

        return result;
      } catch (parseError) {
        console.error("Failed to parse backup script output:", parseError);
        console.error("Raw output:", stdout);

        // Try to extract file path from output using regex
        const filePathMatch = stdout.match(/\"File\":\s*\"(.*?)\"/);
        if (filePathMatch && filePathMatch[1]) {
          const extractedFilePath = filePathMatch[1].replace(/\\\\/g, "\\");
          console.log("Extracted file path:", extractedFilePath);

          return {
            status: "Success",
            file: extractedFilePath,
            size: "0",
            checksum: "",
            timestamp: new Date().toISOString(),
            container: this.containerName,
          };
        }

        throw new Error("Invalid backup script output");
      }
    } catch (error: any) {
      console.error("Backup script execution failed:", error);
      return {
        status: "Failed",
        file: "",
        size: "0",
        checksum: "",
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private async uploadToStorage(filePath: string, userId: string) {
    if (!filePath) {
      throw new Error("File path is empty");
    }

    console.log(`Uploading file: ${filePath}`);

    try {
      // Verify file exists
      await fs.promises.access(filePath, fs.constants.F_OK);

      const fileName = path.basename(filePath);
      // Use consistent bucket name
      const bucketName = "shadowdb-bucket"; 
      const storageKey = `backups/${userId}/${fileName}`;
      const fileBuffer = await fs.promises.readFile(filePath);

      console.log(`File size: ${fileBuffer.length} bytes`);

      const { data, error } = await this.supabaseStorage
        .from(bucketName) // Use the same bucket name here
        .upload(storageKey, fileBuffer, {
          contentType: "application/sql",
          upsert: true,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw error;
      }

      const { data: publicUrl } = this.supabaseStorage
        .from(bucketName) // Use the same bucket name here too
        .getPublicUrl(storageKey);

      return {
        path: storageKey,
        publicUrl: publicUrl.publicUrl,
      };
    } catch (error) {
      console.error(`Error uploading file ${filePath}:`, error);
      throw error;
    }
  }
}
