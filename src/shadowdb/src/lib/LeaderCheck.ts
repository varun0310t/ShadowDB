import axios from "axios";
const leaderPoolIndex = { value: 0 };
const scopeLeaderIndex = new Map<string, number>();
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config(); // Loads variables from a .env file (if present)

const defaultReader = new Pool({
  user: process.env.PG_REPLICA1_USER,
  host: process.env.PG_REPLICA1_HOST,
  database: process.env.PG_REPLICA1_DATABASE,
  password: process.env.PG_REPLICA1_PASSWORD,
  port: parseInt(process.env.PG_REPLICA1_PORT as string, 10),
});

async function checkAndUpdateLeader() {
  try {
    // query all the leader port from the database with the scope name

    const query = `SELECT * from databases where is_replica = false and port is not null`;
    const values: string[] = [];
    const result = await defaultReader.query(query, values);
    const leaderPorts: number[] = [];
    if (result.rowCount) {
      for (let i = 0; i < result.rowCount; i++) {
        const port = result.rows[i].patroni_port;
        leaderPorts.push(port);
      }
    }
    leaderPorts.push(8008);
   for(const port of leaderPorts){ {
      console.log("Leader port", port);

      const response = await axios.get(`http://localhost:${port}/cluster`);
      const clusterInfo = response.data;
      const scope = clusterInfo.scope;
      const n = clusterInfo.members.length;
      for (let i = 0; i < n; i++) {
        if (clusterInfo.members[i].role === "leader") {
          console.log("Leader found at index", i);
          scopeLeaderIndex.set(scope, i);
          break;
        }
      }
    };
  }
  } catch (error) {
    console.error("Error checking leader:", error);
  }
}
checkAndUpdateLeader();
setInterval(checkAndUpdateLeader, 10000);

export { leaderPoolIndex, checkAndUpdateLeader,scopeLeaderIndex };
