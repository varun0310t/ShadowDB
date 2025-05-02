import { getDefaultReaderPool, getDefaultWriterPool } from "../lib/Getpools";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Check database size and enforce quota limits
 */

export async function checkDatabaseSize(databaseId: number): Promise<{
    id: number;
    name: string;
    currentSizeMB: number;
    maxSizeMB: number;
    usagePercent: number;
    exceeded: boolean;
  }> {
    // Get database info
    const { rows } = await getDefaultReaderPool().query(
      `SELECT d.id, d.name, d.container_name, d.max_size_mb, d.password, 
              d.status, d.read_only, u.id as user_id, u.email as user_email 
       FROM databases d
       JOIN users u ON d.owner_id = u.id
       WHERE d.id = $1`,
      [databaseId]
    );
    
    if (rows.length === 0) {
      throw new Error(`Database with ID ${databaseId} not found`);
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
    
    const maxSizeMB = db.max_size_mb || 512;
    const exceeded = currentSizeMB > maxSizeMB;
    
    // If exceeded and not already read-only, set to read-only
    if (exceeded && !db.read_only) {
      console.log(`Database ${db.name} (ID: ${db.id}) has exceeded storage limit. Setting to read-only mode.`);
      
      try {
        // Set database to read-only - much simpler approach!
        const readOnlyCmd = `docker exec -e PGPASSWORD="${db.password}" ${db.container_name} psql -U postgres -c "ALTER DATABASE \\\"${db.name}\\\" SET default_transaction_read_only = on;"`;
        await execAsync(readOnlyCmd);
        
        // Update status in our database
        await getDefaultWriterPool().query(
          "UPDATE databases SET read_only = true, status = 'read_only', status_message = 'Storage limit exceeded' WHERE id = $1",
          [databaseId]
        );
    
      } catch (error) {
        console.error(`Failed to set database ${db.id} to read-only mode:`, error);
      }
    }
    // If under limit and in read-only mode due to quota, restore to read-write
    else if (!exceeded && db.read_only && db.status === 'read_only' && db.status_message === 'Storage limit exceeded') {
      try {
        console.log(`Database ${db.name} (ID: ${db.id}) is now under storage limit. Restoring to read-write mode.`);
        
        // Set database back to read-write - much simpler!
        const readWriteCmd = `docker exec -e PGPASSWORD="${db.password}" ${db.container_name} psql -U postgres -c "ALTER DATABASE \\\"${db.name}\\\" SET default_transaction_read_only = off;"`;
        await execAsync(readWriteCmd);
        
        // Update status in our database
        await getDefaultWriterPool().query(
          "UPDATE databases SET read_only = false, status = 'running', status_message = NULL WHERE id = $1",
          [databaseId]
        );
        
      } catch (error) {
        console.error(`Failed to restore database ${db.id} to read-write mode:`, error);
      }
    }
    
    return {
      id: db.id,
      name: db.name,
      currentSizeMB,
      maxSizeMB,
      usagePercent: (currentSizeMB / maxSizeMB) * 100,
      exceeded
    };
  }
  
/**
 * Check all databases for size limits
 */
export async function checkAllDatabases(): Promise<void> {
  try {
    const { rows } = await getDefaultReaderPool().query(
        "SELECT id FROM databases WHERE status != 'deleted' AND status != 'error' and is_replica = false"
      );
      let exceededCount = 0;
      let approachingCount = 0;
      const batchSize = 5;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(async (db) => {
          try {
            return await checkDatabaseSize(db.id);
          } catch (error) {
            console.error(`Error checking database ${db.id}:`, error);
            return null;
          }
        }));
        
        // Process results
        results.filter(Boolean).forEach(sizeInfo => {
          if (sizeInfo?.exceeded) {
            exceededCount++;
            console.warn(`⚠️ Database ${sizeInfo.name} (${sizeInfo.id}) EXCEEDED: ${sizeInfo.currentSizeMB.toFixed(2)}MB / ${sizeInfo.maxSizeMB}MB (${sizeInfo.usagePercent.toFixed(2)}%)`);
          } else if (sizeInfo?.usagePercent ||10 > 90) {
            approachingCount++;
            console.warn(`⚠️ Database ${sizeInfo?.name} (${sizeInfo?.id}) approaching limit: ${sizeInfo?.currentSizeMB.toFixed(2)}MB / ${sizeInfo?.maxSizeMB}MB (${sizeInfo?.usagePercent.toFixed(2)}%)`);
          }
        });
      }
      

    
  } catch (error) {
    console.error("Failed to check database sizes:", error);
  }
}

/**
 * Start monitoring service
 */
export function startStorageMonitoring(intervalMinutes = 15): void {
  // Check immediately on startup
  checkAllDatabases().catch(err => console.error("Initial storage check failed:", err));
  
  // Set up recurring checks
  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(checkAllDatabases, intervalMs);
  
  console.log(`Storage monitoring scheduled to run every ${intervalMinutes} minutes`);
}