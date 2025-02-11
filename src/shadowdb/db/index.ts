import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config(); // Loads variables from a .env file (if present)

const pool = new Pool({
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DATABASE || "shadowdb",
  password: process.env.PG_PASSWORD || "yourpassword",
  port: parseInt(process.env.PG_PORT || "5432", 10),
});

// Optional: test the connection on startup
pool
  .query("SELECT NOW()")
  .then((res) => console.log("Connected to PostgreSQL at:", res.rows[0].now))
  .catch((err) => console.error("Connection error", err));

export default pool;