import SupaBaseClient from '@/lib/SupaBaseClient';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface BackupResult {
  status: 'Success' | 'Failed';
  file: string;
  size: string;
  checksum: string;
  timestamp: string;
  container?: string;
  error?: string;
}

export class BackupManager {
  private supabase;
  private backupPath: string;
  private containerName: string;

  constructor() {
    this.supabase = SupaBaseClient;
    this.backupPath = process.env.BACKUP_PATH || 'C:\\PostgreSQL\\backups';
    this.containerName = process.env.POSTGRES_CONTAINER || 'docker-patroni_primary-1';
  }

  async createBackup(userId: number, databaseName: string): Promise<number> {
    try {
      // Create initial backup record
      const { data: backupRecord, error: insertError } = await this.supabase
        .from('backup_records')
        .insert({
          user_id: userId,
          database_name: databaseName,
          backup_type: 'manual',
          status: 'in_progress',
          storage_location: 'supabase',
          created_by: userId
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Execute PowerShell backup script
      const backupResult = await this.executeBackupScript(databaseName);

      // Upload to Supabase Storage
      const storageFile = await this.uploadToStorage(backupResult.file, userId);

      // Update backup record
      const { error: updateError } = await this.supabase
        .from('backup_records')
        .update({
          status: backupResult.status === 'Success' ? 'completed' : 'failed',
          file_path: storageFile.path,
          file_name: path.basename(backupResult.file),
          file_size: backupResult.size,
          checksum: backupResult.checksum,
          completed_at: backupResult.timestamp,
          storage_path: storageFile.publicUrl,
          script_output: backupResult,
          error_message: backupResult.error
        })
        .eq('id', backupRecord.id);

      if (updateError) throw updateError;

      // Clean up local file
      await fs.promises.unlink(backupResult.file);

      return backupRecord.id;

    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  private async executeBackupScript(databaseName: string): Promise<BackupResult> {
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'backup-database.ps1');
      
      // Get password from environment variable
      const password = process.env.POSTGRES_PASSWORD;
      if (!password) {
        throw new Error('Database password not configured');
      }

      const { stdout, stderr } = await execAsync(
        `powershell -NonInteractive -File "${scriptPath}" \
        -DatabaseName "${databaseName}" \
        -BackupPath "${this.backupPath}" \
        -ContainerName "${this.containerName}" \
        -Password "${password}"`
      );

      if (stderr) {
        console.error('Backup script stderr:', stderr);
        throw new Error(stderr);
      }

      try {
        return JSON.parse(stdout.trim()) as BackupResult;
      } catch (parseError) {
        console.error('Failed to parse backup script output:', stdout);
        throw new Error('Invalid backup script output');
      }

    } catch (error: any) {
      console.error('Backup script execution failed:', error);
      return {
        status: 'Failed',
        file: '',
        size: '0',
        checksum: '',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  private async uploadToStorage(filePath: string, userId: number) {
    const fileName = path.basename(filePath);
    const storageKey = `backups/${userId}/${fileName}`;
    const fileBuffer = await fs.promises.readFile(filePath);

    const { data, error } = await this.supabase
      .storage
      .from('database-backups')
      .upload(storageKey, fileBuffer, {
        contentType: 'application/sql',
        upsert: true
      });

    if (error) throw error;

    const { data: publicUrl } = this.supabase
      .storage
      .from('database-backups')
      .getPublicUrl(storageKey);

    return {
      path: storageKey,
      publicUrl: publicUrl.publicUrl
    };
  }
}