import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// The bucket where backups will be stored
const BACKUP_BUCKET = process.env.SUPABASE_BACKUP_BUCKET || 'shadowdb-bucket';

export default class StorageService {
  /**
   * Upload a backup file to Supabase Storage
   */
  public async uploadBackup(
    filePath: string,
    userId: string,
    databaseName: string,
    backupId: string
  ): Promise<{ path: string; url: string }> {
    try {
      // Ensure the file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
     console.log(`Uploading backup file: ${filePath}`);
      // Create the storage path
      const filename = path.basename(filePath);
      const storagePath = `${userId}/${databaseName}/${backupId}/${filename}`;
      
      // Read the file as a buffer
      const fileBuffer = await fs.promises.readFile(filePath);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase
        .storage
        .from(BACKUP_BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: 'application/sql',
          upsert: true
        });
      
      if (error) {
        throw new Error(`Supabase upload error: ${error.message}`);
      }
      
      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from(BACKUP_BUCKET)
        .getPublicUrl(storagePath);
      
      console.log(`Backup file uploaded to Supabase: ${storagePath}`);
      
      return {
        path: storagePath,
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error(`Failed to upload backup to Supabase: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a backup from Supabase Storage
   */
  public async deleteBackup(storagePath: string): Promise<void> {
    try {
      // Delete from Supabase Storage
      const { error } = await supabase
        .storage
        .from(BACKUP_BUCKET)
        .remove([storagePath]);
      
      if (error) {
        throw new Error(`Supabase delete error: ${error.message}`);
      }
      
      console.log(`Backup file deleted from Supabase: ${storagePath}`);
    } catch (error) {
      console.error(`Failed to delete backup from Supabase: ${error}`);
      throw error;
    }
  }

  /**
   * List all backups for a specific database
   */
  public async listBackups(userId: string, databaseName: string): Promise<string[]> {
    try {
      const path = `${userId}/${databaseName}`;
      
      const { data, error } = await supabase
        .storage
        .from(BACKUP_BUCKET)
        .list(path, {
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (error) {
        throw new Error(`Supabase list error: ${error.message}`);
      }
      
      return data.map(item => `${path}/${item.name}`);
    } catch (error) {
      console.error(`Failed to list backups from Supabase: ${error}`);
      throw error;
    }
  }

  /**
   * Generate a signed URL with temporary access to a backup file
   */
  public async getSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
    try {
      const { data, error } = await supabase
        .storage
        .from(BACKUP_BUCKET)
        .createSignedUrl(storagePath, expiresIn);
      
      if (error) {
        throw new Error(`Supabase signed URL error: ${error.message}`);
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error(`Failed to generate signed URL: ${error}`);
      throw error;
    }
  }

  /**
   * Download a backup file from storage
   */
  public async downloadBackup(storagePath: string, destinationPath: string): Promise<string> {
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(destinationPath);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
      
      // Download from Supabase
      const { data, error } = await supabase
        .storage
        .from(BACKUP_BUCKET)
        .download(storagePath);
      
      if (error) {
        throw new Error(`Supabase download error: ${error.message}`);
      }
      
      // Write to file
      await fs.promises.writeFile(destinationPath, Buffer.from(await data.arrayBuffer()));
      
      console.log(`Backup downloaded to: ${destinationPath}`);
      return destinationPath;
    } catch (error) {
      console.error(`Failed to download backup: ${error}`);
      throw error;
    }
  }
}