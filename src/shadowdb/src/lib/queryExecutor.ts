import { Pool, QueryResult } from "pg";
import {
  getWriterPool,
  getReaderPool,
  getDefaultReaderPool,
} from "./userPools";
import { initializeUserPool } from "./initializeUserPools";
import { checkAndUpdateLeader } from "./LeaderCheck";


function isWriteQuery(query: string): boolean {
  // Remove single-line (--) and multi-line (/* */) comments
  const cleanedQuery = query
    .replace(/--.*$/gm, '')                    // Remove -- comments
    .replace(/\/\*[\s\S]*?\*\//g, '')          // Remove /* */ comments
    .trim();                                   // Trim leading/trailing whitespace

  // Extract first keyword
  const firstWord = cleanedQuery.match(/^\w+/i)?.[0]?.toUpperCase();

  // Consider SELECT and WITH as read queries (WITH is used in CTEs)
  return !(firstWord === 'SELECT' || firstWord === 'WITH');
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeQuery(
  userId: string,
  db_name: string, // Now requiring database name
  query: string,
  params: string[] = [],
  ClusterScope: string = "default"
): Promise<QueryResult<any>> {
  let pool: Pool | undefined;
  const normalizedQuery = query.trim();
  const queryType = isWriteQuery(normalizedQuery) ? "write" : "read";

  // Create a compound key for user-db combinations
  const poolKey = `${userId}:${db_name}:${ClusterScope}`;


  await checkAndUpdateLeader();

  // Get pool for specific database
  pool = isWriteQuery(normalizedQuery)
    ? getWriterPool(poolKey)
    : getReaderPool(poolKey);

  if (!pool) {
    try {
      // Check if user has access to this database
      const accessQuery = `
        SELECT d.tenancy_type, d.name as db_name, ud.access_level 
        FROM databases d
        JOIN user_databases ud ON d.id = ud.database_id
        WHERE ud.user_id = $1 AND d.name = $2;
      `;
      const accessValues = [userId, db_name];
      const accessResult = await getDefaultReaderPool().query(
        accessQuery,
        accessValues
      );

      if (accessResult.rowCount === 0) {
        throw new Error(`User does not have access to database: ${db_name}`);
      }

      const { tenancy_type } = accessResult.rows[0];

      // Initialize pool for this specific database
      await initializeUserPool(tenancy_type, db_name, userId);

      if (process.env.environment === "development") {
        await checkAndUpdateLeader();
      }

      // Get the newly initialized pool

      pool = isWriteQuery(normalizedQuery)
        ? getWriterPool(poolKey)
        : getReaderPool(poolKey);
    } catch (error: any) {
      console.error(
        `Error accessing database ${db_name} for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  try {
    if (!pool) throw new Error(`Pool not found for database: ${db_name}`);

    const startTime = process.hrtime();
    console.log("Executing query:", normalizedQuery);
    console.log("With parameters:", params);
    const result = await pool.query(normalizedQuery, params);
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const durationInSeconds = seconds + nanoseconds / 1e9;

    // Increment success counter and record execution time with database info
 
    console.log(
      `Executed query for user: ${userId} on DB: ${db_name} (${queryType}) in ${durationInSeconds.toFixed(
        3
      )}s`
    );

  
    console.log("Result:", result);
    return result;
  } catch (error) {
    console.error(`Error executing query on database ${db_name}:`, error);
    // Increment failure counter with database info

    throw error;
  }
}
