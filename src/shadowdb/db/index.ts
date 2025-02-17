import { Pool } from "pg";
import dotenv from "dotenv";
import axios from "axios";
import { setUserPool, getUserPool } from "../lib/userPools";

dotenv.config(); // Loads variables from a .env file (if present)

// Default writer pool
const defaultWriter = new Pool({
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DATABASE || "shadowdb",
  password: process.env.PG_PASSWORD || "yourpassword",
  port: parseInt(process.env.PG_PORT || "5432", 10),
});

// Default reader pools
const defaultReaders = [
  new Pool({
    user: process.env.PG_USER_REPLICA1 || "postgres",
    host: process.env.PG_HOST_REPLICA1 || "localhost",
    database: process.env.PG_DATABASE_REPLICA1 || "shadowdb",
    password: process.env.PG_PASSWORD_REPLICA1 || "yourpassword",
    port: parseInt(process.env.PG_PORT_REPLICA1 || "5433", 10),
  }),
  new Pool({
    user: process.env.PG_USER_REPLICA2 || "postgres",
    host: process.env.PG_HOST_REPLICA2 || "localhost",
    database: process.env.PG_DATABASE_REPLICA2 || "shadowdb",
    password: process.env.PG_PASSWORD_REPLICA2 || "yourpassword",
    port: parseInt(process.env.PG_PORT_REPLICA2 || "5434", 10),
  })
];

// Initialize default pools in userPools system
setUserPool('default', defaultWriter, 0);
defaultReaders.forEach((reader, index) => {
  setUserPool('default', reader, index + 1);
});

// Test connections
async function testConnections() {
  try {
    await defaultWriter.query("SELECT NOW()");
    console.log("Connected to default writer");
    
    for (const reader of defaultReaders) {
      await reader.query("SELECT NOW()");
      console.log("Connected to reader replica");
    }
  } catch (err) {
    console.error("Connection error", err);
  }
}

testConnections();

// Object to store the index of the current leader pool
const leaderPoolIndex = { value: 0 };

async function checkAndUpdateLeader() {
  try {
    const response = await axios.get("http://localhost:8008/cluster");
    const clusterInfo = response.data;

    for (let i = 0; i < clusterInfo.nodes.length; i++) {
      if (clusterInfo.nodes[i].role === "leader") {
        console.log("Leader found at index", i);
        leaderPoolIndex.value = i;
        break;
      }
    }
  } catch (error) {
    console.error("Error checking leader:", error);
  }
}

setInterval(checkAndUpdateLeader, 10000);


export {  leaderPoolIndex };
