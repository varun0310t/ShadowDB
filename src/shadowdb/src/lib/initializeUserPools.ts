import "../db/index";
import { getDefaultWriterPool, getUserPool, setUserPool } from "./userPools";
import { DatabaseError, Pool } from "pg";
import axios from "axios";

const DB_SERVICE_URL = process.env.DB_SERVICE_URL || "http://localhost:3001";

export async function initializeUserPool(
  tenancy_type: string,
  db_name: string | null,
  userId: string,
  dbId?: number,
  replicaCount: number = 2,
  ClusterScope = "default"
) {
  // Create a compound key for user-db combinations
  const poolKey = `${userId}:${db_name}:${ClusterScope}`;

  // Check existing pools for both types
  const existingPools = getUserPool(poolKey);
  if (existingPools && existingPools.length > 0) {
    console.log(
      `Using existing pools for user: ${userId}, database: ${db_name}`
    );
    return {
      writer: existingPools[0],
      readerCount: existingPools.length - 1,
      status: "connected",
    };
  }

  if (tenancy_type === "shared" && db_name) {
    // Create database
    try {
      await getDefaultWriterPool().query(`CREATE DATABASE ${db_name}`);
    } catch (error: unknown) {
      if (error instanceof DatabaseError && error.code === "42P04") {
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
        const replicaPassword = encodeURIComponent(
          process.env[`PG_REPLICA${i + 1}_PASSWORD`] || ""
        );

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
        db_name: db_name,
      };
    } catch (err) {
      console.error(`Connection error for ${db_name}:`, err);
      throw err;
    }
  } else if (tenancy_type === "isolated" && db_name) {
    // For isolated databases, get connection info from DB service database
    try {
      // First, get the database details using the dbId or by querying
      let dbDetails;

      // Query the database connection info from the user_databases relationship
      const query = `
        SELECT d.* FROM user_databases ud
        JOIN databases d ON ud.database_id = d.id
        WHERE ud.user_id = $1 AND d.name = $2 AND d.tenancy_type = 'isolated'
      `;

      const result = await getDefaultWriterPool().query(query, [
        userId,
        db_name,
      ]);

      if (result.rows.length === 0 && !dbId) {
        throw new Error(
          `No isolated database found with name ${db_name} for user ${userId}`
        );
      }

      // If we found database info in our metadata DB
      if (result.rows.length > 0) {
        dbDetails = result.rows[0];
      }

      if (!dbDetails) {
        throw new Error("Could not find database details");
      }

      console.log(`Creating new pools for isolated database: ${db_name}`);
      console.log("dbDetails", dbDetails);
      // Get connection details from database record
      const host = process.env.DB_SERVICE_HOST || "localhost";
      const port = dbDetails.port;


      // Create writer pool (connecting to primary)
      const writerPool = new Pool({
        host: host,
        port: port,
        database: db_name,
        user: "postgres",
        password: dbDetails.password,
        application_name: `isolated-writer-${db_name}`,
      });
      console.log("writerPool", writerPool);
      // Test the connection
      await writerPool.query("SELECT NOW()");
      console.log(`Connected to isolated PostgreSQL writer for ${db_name}`);
      setUserPool(poolKey, writerPool, 0);

      // Get replicas if any
      let replicas = [];
      try {
        // If replicas aren't in the dbDetails object, query for them
        if (!dbDetails.replicas) {
          // First try to find replicas in our database
          const replicaQuery = `
            SELECT * FROM databases 
            WHERE parent_id = $1 AND is_replica = true AND status = 'running'
          `;

          const replicaResult = await getDefaultWriterPool().query(
            replicaQuery,
            [dbDetails.id]
          );

          if (replicaResult.rows.length > 0) {
            replicas = replicaResult.rows;
          } else {
            // If not found in our database, query the DB service
            try {
              const response = await axios.get(
                `${DB_SERVICE_URL}/api/databases/${dbDetails.id}/replicas`
              );
              if (response.data && Array.isArray(response.data)) {
                replicas = response.data;
              }
            } catch (replicaErr: unknown) {
              if (replicaErr instanceof Error) {
                console.error(
                  `Error fetching replicas from DB service: ${replicaErr.message}`
                );
              } else {
                console.error(
                  `Error fetching replicas from DB service: ${JSON.stringify(
                    replicaErr
                  )}`
                );
              }
              // Continue without replicas
            }
          }
        } else {
          replicas = dbDetails.replicas;
        }

        console.log(
          `Found ${replicas.length} replicas for database ${db_name}`
        );
      } catch (replicaErr: unknown) {
        const errorMessage = replicaErr instanceof Error ? replicaErr.message : JSON.stringify(replicaErr);
        console.warn(`Error querying for replicas: ${errorMessage}`);
        // Continue with empty replicas array
      }

      // Set up read replicas if available
      for (let i = 0; i < replicas.length; i++) {
        const replica = replicas[i];

        if (replica.status === "running") {
          const readerPool = new Pool({
            host: host,
            port: replica.port,
            database: db_name,
            user: "postgres",
            password: dbDetails.password,
            application_name: `isolated-reader-${i + 1}-${db_name}`,
          });

          try {
            await readerPool.query("SELECT NOW()");
            console.log(
              `Connected to isolated PostgreSQL reader-${i + 1} for ${db_name}`
            );
            setUserPool(poolKey, readerPool, i + 1);
          } catch (err) {
            console.error(`Error connecting to replica ${i + 1}:`, err);
            // Continue with other replicas even if one fails
          }
        }
      }

      const pools = getUserPool(poolKey);
      return {
        writer: pools?.[0],
        readerCount: (pools?.length || 1) - 1,
        status: "connected",
        db_name: db_name,
      };
    } catch (err) {
      console.error(`Connection error for isolated database ${db_name}:`, err);
      throw err;
    }
  }

  return { message: "Unknown database type or missing parameters" };
}

// Add a helper function to get all users' isolated databases
export async function initializeAllIsolatedPools() {
  try {
    const { rows } = await getDefaultWriterPool().query(`
      SELECT ud.user_id, d.name, d.id 
      FROM user_databases ud
      JOIN databases d ON ud.database_id = d.id
      WHERE d.tenancy_type = 'isolated'
    `);

    for (const row of rows) {
      try {
        await initializeUserPool("isolated", row.name, row.user_id, row.id);
        console.log(`Initialized pool for isolated database: ${row.name}`);
      } catch (err) {
        console.error(`Failed to initialize pool for ${row.name}:`, err);
      }
    }

    console.log(`Initialized ${rows.length} isolated database pools`);
  } catch (err) {
    console.error("Failed to initialize isolated pools:", err);
  }
}
