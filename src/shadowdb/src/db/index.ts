import { Pool } from "pg";
import dotenv from "dotenv";
import { setUserPool } from "../lib/userPools";

dotenv.config(); // Loads variables from a .env file (if present)

// Default writer pool
const defaultWriter = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT as string, 10),
});

// Default reader pools
const defaultReaders = [
  new Pool({
    user: process.env.PG_REPLICA1_USER,
    host: process.env.PG_REPLICA1_HOST,
    database: process.env.PG_REPLICA1_DATABASE,
    password: process.env.PG_REPLICA1_PASSWORD,
    port: parseInt(process.env.PG_REPLICA1_PORT as string, 10),
  }),
  new Pool({
    user: process.env.PG_REPLICA2_USER,
    host: process.env.PG_REPLICA2_HOST,
    database: process.env.PG_REPLICA2_DATABASE,
    password: process.env.PG_REPLICA2_PASSWORD,
    port: parseInt(process.env.PG_REPLICA2_PORT as string, 10),
  })
];

// Initialize default pools in userPools system
setUserPool('default:default:shadowdb', defaultWriter, 0);

setUserPool('default:default:shadowdb', defaultReaders[0], 1);
setUserPool('default:default:shadowdb', defaultReaders[1], 2);

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

