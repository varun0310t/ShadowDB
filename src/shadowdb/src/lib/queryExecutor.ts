import { Pool, QueryResult } from "pg";
import {
  getWriterPool,
  getReaderPool,
  getDefaultReaderPool,
} from "./userPools";
import { initializeUserPool } from "./initializeUserPools";
import { checkAndUpdateLeader, leaderPoolIndex } from "./LeaderCheck";
import Rclient from "../db/RedisClient";
import { CacheOptions, getCacheKey } from "./Caching";
import {
  queryCounter,
  queryFailureCounter,
  queryDurationHistogram,
} from "./monitoring";

function isWriteQuery(query: string): boolean {
  return /^(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE)/i.test(
    query.trim()
  );
}

export async function executeQuery(
  userId: string,
  db_name: string, // Now requiring database name
  query: string,
  params: any[] = [],
  cacheOptions?: CacheOptions
): Promise<QueryResult<any>> {
  let pool: Pool | undefined;
  const normalizedQuery = query.trim();
  const queryType = isWriteQuery(normalizedQuery) ? "write" : "read";

  // Create a compound key for user-db combinations
  const poolKey = `${userId}:${db_name}`;

  // Use cache on read queries if enabled.
  if (queryType === "read" && cacheOptions?.cache) {
    const key = getCacheKey(poolKey, normalizedQuery, params, cacheOptions);
    const cachedResultStr = await Rclient.get(key);
    if (cachedResultStr) {
      console.log("Returning cached result from Redis for key:", key);
      // Increment the counter on cache hit.
      queryCounter.inc({ userId, db_name, queryType });
      return JSON.parse(cachedResultStr) as QueryResult<any>;
    }
  }
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
    queryCounter.inc({ userId, db_name, queryType });
    queryDurationHistogram.observe(
      { userId, db_name, queryType },
      durationInSeconds
    );
    console.log(
      `Executed query for user: ${userId} on DB: ${db_name} (${queryType}) in ${durationInSeconds.toFixed(
        3
      )}s`
    );

    // Cache result for read queries, if applicable
    if (queryType === "read" && cacheOptions?.cache) {
      const key = getCacheKey(poolKey, normalizedQuery, params, cacheOptions);
      const ttl = cacheOptions.ttlSeconds ?? 60;
      await Rclient.set(key, JSON.stringify(result), { EX: ttl });
      console.log("Cached result for key:", key, "with TTL:", ttl);
    }
    console.log("Result:", result);
    return result;
  } catch (error) {
    console.error(`Error executing query on database ${db_name}:`, error);
    // Increment failure counter with database info
    queryFailureCounter.inc({ userId, db_name, queryType });
    throw error;
  }
}
