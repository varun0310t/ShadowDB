import { getDefaultReaderPool } from "../Getpools";
import net from 'net';  



export function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true); // Port is in use
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        server.close();
        resolve(false); // Port is available
      })
      .listen(port);
  });
}


// Updated findAvailablePort function
export async function findAvailablePort(startPort: number): Promise<number> {
  try {
    // Get all used ports from database
    const { rows } = await getDefaultReaderPool().query(
      "SELECT port FROM databases UNION SELECT patroni_port AS port FROM databases WHERE patroni_port IS NOT NULL"
    );
    const usedPorts = new Set(rows.map((row) => row.port));
    console.log("Used ports from database:", usedPorts);

    // Find an available port that's not used by DB or already in use on the machine
    let port = startPort;
    while (usedPorts.has(port) || await isPortInUse(port)) {
      port++;
    }

    return port;
  } catch (error) {
    console.error("Error finding available port:", error);
    // Fallback to random port in a higher range
    return 10000 + Math.floor(Math.random() * 5000);
  }
}