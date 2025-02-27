import "../db/index";
import {
  getDefaultWriterPool,
  getUserPool,
  setUserPool,
} from "./userPools";
import { Pool } from "pg";

export async function initializeUserPool(
  tenancy_type: string,
  db_name: string | null,
  userId: string,
  replicaCount: number = 2
) {
  if (tenancy_type === "isolated" && db_name) {
    // Create a compound key for user-db combinations
    const poolKey = `${userId}:${db_name}`;
    
    // Check existing pools
    const existingPools = getUserPool(poolKey);
    if (existingPools && existingPools.length > 0) {
      console.log(`Using existing pools for user: ${userId}, database: ${db_name}`);
      return {
        writer: existingPools[0],
        readerCount: existingPools.length - 1,
        status: "connected",
      };
    }

    // Create database
    try {
      await getDefaultWriterPool().query(`CREATE DATABASE ${db_name}`);
    } catch (error: any) {
      if (error.code === "42P04") {
        console.log(`Database ${db_name} already exists`);
      } else {
        console.error(`Error creating database ${db_name}:`, error);
        return { message: "Database creation failed" };
      }
    }

    // Create writer pool
    console.log(`Creating new pools for user: ${userId}, database: ${db_name}`);
    const password = encodeURIComponent(process.env.PG_PASSWORD || "");
    const writerPool = new Pool({
      connectionString: `postgresql://${process.env.PG_USER}:${password}@${process.env.PG_HOST}:${process.env.PG_PORT}/${db_name}`,
      application_name: `writer-${db_name}`,
    });

    try {
      // Test and set up writer pool (index 0)
      await writerPool.query("SELECT NOW()");
      console.log(`Connected to PostgreSQL writer for ${db_name}`);
      setUserPool(poolKey, writerPool, 0);

      // Set up read replicas (index 1 onwards)
      for (let i = 0; i < replicaCount; i++) {
        const replicaUser = process.env[`PG_REPLICA${i + 1}_USER`];
        const replicaHost = process.env[`PG_REPLICA${i + 1}_HOST`];
        const replicaPort = process.env[`PG_REPLICA${i + 1}_PORT`];
        const replicaPassword = encodeURIComponent(process.env[`PG_REPLICA${i + 1}_PASSWORD`] || "");

        const readerPool = new Pool({
          connectionString: `postgresql://${replicaUser}:${replicaPassword}@${replicaHost}:${replicaPort}/${db_name}`,
          application_name: `reader-${i + 1}-${db_name}`,
        });

        await readerPool.query("SELECT NOW()");
        console.log(`Connected to PostgreSQL reader-${i + 1} for ${db_name}`);
        setUserPool(poolKey, readerPool, i + 1);
      }

      const pools = getUserPool(poolKey);
      return {
        writer: pools?.[0],
        readerCount: (pools?.length || 1) - 1,
        status: "connected",
        db_name: db_name
      };
    } catch (err) {
      console.error(`Connection error for ${db_name}:`, err);
      throw err;
    }
  }
  return { message: "Shared pool in use" };
}
