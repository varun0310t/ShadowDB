import { Pool, QueryResult } from "pg";
import { getWriterPool, getReaderPool } from "./userPools";
import { initializeUserPool } from "./initializeUserPools";
import { getDefaultReaderPool } from "./userPools";
import { checkAndUpdateLeader, leaderPoolIndex } from "./LeaderCheck";
/**
 * Determines if the query is a write operation by checking if it starts
 * with INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, or TRUNCATE.
 * This is a basic heuristic and might need adjustment for edge cases.
 */
function isWriteQuery(query: string): boolean {
  return /^(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE)/i.test(
    query.trim()
  );
}

/**
 * Executes a SQL query on the appropriate pool based on whether it is a read or write.
 *
 * @param userId - The user (or tenant) ID used to get the connection pools.
 * @param query - The SQL query to execute.
 * @param params - Optional parameters for parameterized queries.
 * @returns A promise that resolves to the query result.
 */
export async function executeQuery(
  userId: string,
  query: string,
  params: any[] = []
): Promise<QueryResult<any>> {
  let pool: Pool | undefined;

  // Use the appropriate pool based on the query type.
  if (isWriteQuery(query)) {
    pool = getWriterPool(userId);
  } else {
    pool = getReaderPool(userId);
  }

  if (!pool) {
    // this logic is not defined now but for now we will create new connection basically
    //throw new Error(`No suitable pool available for user: ${userId}`);

    try {
      const configquery = `SELECT tenancy_type, db_name FROM users WHERE id = $1`;
      const values = [userId];
      // Use appropriate pool for reading user config
      const result = await getDefaultReaderPool().query(configquery, values);

      if (result.rowCount === 0) {
        throw new Error("User configuration not found");
      }

      const { tenancy_type, db_name } = result.rows[0];
      const poolStatus = await initializeUserPool(
        tenancy_type,
        db_name,
        userId
      );
      console.log("Pool status:", poolStatus);
      if (process.env.environment === "development") {
        await checkAndUpdateLeader().then(() => {
        });
      }
      if (isWriteQuery(query)) {
        pool = getWriterPool(userId);
      } else {
        pool = getReaderPool(userId);
      }
    } catch (error: any) {
      console.error("Error starting user application:", error);
      throw new error("Error starting user application:", error);
    }
  }

  try {
    if (!pool) {
      throw new Error("Pool not found");
    }
    return await pool.query(query, params);
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}
