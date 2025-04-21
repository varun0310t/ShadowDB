import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Updated to check Patroni status instead of just PostgreSQL
export async function IsPatroniReady(
  containerName: string,
  patroniPort: number,
  isReplica = false  // Add parameter to indicate if we're checking a replica
): Promise<void> {
  let isReady = false;
  let attempts = 0;
  const maxAttempts = 30;

  while (!isReady && attempts < maxAttempts) {
    attempts++;
    console.log(`Checking if PostgreSQL is ready (attempt ${attempts}/${maxAttempts})`);
    try {
      // Check if PostgreSQL is accepting connections
      const { stdout: pgIsReady } = await execAsync(
        `docker exec ${containerName} pg_isready -h localhost -p 5432 -U postgres`
      );
      
      if (pgIsReady.includes("accepting connections")) {
        // Check if it's in recovery mode
        const { stdout: recoveryStatus } = await execAsync(
          `docker exec ${containerName} psql -U postgres -c "SELECT pg_is_in_recovery();"`
        );
        
        if (isReplica) {
          // For replicas, we expect recovery mode to be true
          if (recoveryStatus.includes("t")) {
            console.log(`${containerName} is successfully running as a replica`);
            isReady = true;
          } else {
            console.log(`Waiting for ${containerName} to enter recovery mode...`);
          }
        } else {
          // For primaries, we expect recovery mode to be false
          if (recoveryStatus.includes("f")) {
            console.log(`${containerName} is successfully running as a primary`);
            isReady = true;
          } else {
            console.log(`Waiting for ${containerName} to exit recovery mode...`);
          }
        }
      } else {
        console.log(`PostgreSQL not ready yet: ${pgIsReady}`);
      }
    } catch (error) {
      console.log(`Error checking PostgreSQL status: ${error}`);
    }
    
    if (!isReady) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (!isReady) {
    throw new Error(`PostgreSQL ${isReplica ? 'replica' : 'primary'} failed to start after ${maxAttempts} attempts`);
  }
  
  // Try to check Patroni health if curl is available (optional)
  try {
    const { stdout: curlCheck } = await execAsync(
      `docker exec ${containerName} which curl`
    );
    
    if (curlCheck.includes("curl")) {
      console.log("curl is available, checking Patroni health...");
      
      try {
        const { stdout: health } = await execAsync(
          `docker exec ${containerName} curl -s http://localhost:8008/health`
        );
        console.log(`Patroni health check response: ${health}`);
        
        const patroniHealth = JSON.parse(health);
        if (patroniHealth.state === "running") {
          console.log(`Patroni is running in ${patroniHealth.role || "unknown"} role`);
        }
      } catch (healthError) {
        console.log(`Patroni health check failed: ${healthError}`);
      }
    }
  } catch (curlError) {
    console.log("curl is not available, skipping Patroni health check");
  }
  
  console.log(`PostgreSQL on ${containerName} is ready!`);
}