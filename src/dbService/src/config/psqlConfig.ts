import pool from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pool;

const defaultWriter = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT as any, 10),
});

const defaultReaders = [
  new Pool({
    user: process.env.PG_REPLICA1_USER,
    host: process.env.PG_REPLICA1_HOST,
    database: process.env.PG_REPLICA1_DATABASE,
    password: process.env.PG_REPLICA1_PASSWORD,
    port: parseInt(process.env.PG_REPLICA1_PORT as any, 10),
  }),
  new Pool({
    user: process.env.PG_REPLICA2_USER,
    host: process.env.PG_REPLICA2_HOST,
    database: process.env.PG_REPLICA2_DATABASE,
    password: process.env.PG_REPLICA2_PASSWORD,
    port: parseInt(process.env.PG_REPLICA2_PORT as any, 10),
  }),
];

// Function to get the default writer pool
export function getDefaultWriterPool() {
  return defaultWriter;
}
// Function to get the default reader pool
export function getDefaultReaderPool() {
  return defaultReaders[0]; // Return the first reader pool for simplicity
}
