import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Updated to check Patroni status instead of just PostgreSQL
export async function IsPatroniReady(
  containerName: string,
  patroniPort: number
): Promise<void> {
  let retries = 30;

  // Check via Patroni API
  const checkCmd = `docker exec ${containerName} curl -s http://localhost:8008/health`;

  while (retries > 0) {
    try {
      const { stdout } = await execAsync(checkCmd);
      console.log(`Patroni health check response: ${stdout}`);
      const health = JSON.parse(stdout);

      // Look for state: running and role: master/leader
      if (health && health.state === "running") {
        console.log(`Patroni instance ${containerName} is ready and running`);
        return;
      }

      console.log(`Waiting for Patroni to be ready: ${stdout}`);
    } catch (error) {
      console.log(`Waiting for Patroni to be ready (retry ${30 - retries}/30)`);
    }

    retries--;
    if (retries === 0) {
      console.error(
        `Patroni health checks failed after 30 retries. Last response:`
      );
      throw new Error("Patroni/PostgreSQL failed to start");
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
