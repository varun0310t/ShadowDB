import { Pool, QueryResult } from "pg";
import { getWriterPool, getReaderPool, getDefaultReaderPool } from "./userPools";
import { initializeUserPool } from "./initializeUserPools";
import { checkAndUpdateLeader, leaderPoolIndex } from "./LeaderCheck";
import Rclient from "../db/RedisClient";
import { CacheOptions, getCacheKey } from "./Caching";
import { queryCounter, queryFailureCounter, queryDurationHistogram } from "./monitoring";

function isWriteQuery(query: string): boolean {
  return /^(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE)/i.test(query.trim());
}

export async function executeQuery(
  userId: string,
  query: string,
  params: any[] = [],
  cacheOptions?: CacheOptions
): Promise<QueryResult<any>> {
  let pool: Pool | undefined;
  const normalizedQuery = query.trim();
  const queryType = isWriteQuery(normalizedQuery) ? "write" : "read";

  // Use cache on read queries if enabled.
  if (queryType === "read" && cacheOptions?.cache) {
    const key = getCacheKey(userId, normalizedQuery, params, cacheOptions);
    const cachedResultStr = await Rclient.get(key);
    if (cachedResultStr) {
      console.log("Returning cached result from Redis for key:", key);
      // Increment the counter on cache hit.
      queryCounter.inc({ userId, queryType });
      return JSON.parse(cachedResultStr) as QueryResult<any>;
    }
  }

  pool = isWriteQuery(normalizedQuery) ? getWriterPool(userId) : getReaderPool(userId);
  if (!pool) {
    try {
      const configQuery = `SELECT tenancy_type, db_name FROM users WHERE id = $1`;
      const values = [userId];
      const result = await getDefaultReaderPool().query(configQuery, values);
      if (result.rowCount === 0) {
        throw new Error("User configuration not found");
      }
      const { tenancy_type, db_name } = result.rows[0];
      await initializeUserPool(tenancy_type, db_name, userId);
      if (process.env.environment === "development") {
        await checkAndUpdateLeader();
      }
      pool = isWriteQuery(normalizedQuery) ? getWriterPool(userId) : getReaderPool(userId);
    } catch (error: any) {
      console.error("Error starting user application:", error);
      throw error;
    }
  }

  try {
    if (!pool) throw new Error("Pool not found");

    const startTime = process.hrtime();
    const result = await pool.query(normalizedQuery, params);
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const durationInSeconds = seconds + nanoseconds / 1e9;

    // Increment success counter and record execution time.
    queryCounter.inc({ userId, queryType });
    queryDurationHistogram.observe({ userId, queryType }, durationInSeconds);
    console.log(`Executed query for user: ${userId} (${queryType}) in ${durationInSeconds.toFixed(3)}s`);

    // Cache result for read queries, if applicable.
    if (queryType === "read" && cacheOptions?.cache) {
      const key = getCacheKey(userId, normalizedQuery, params, cacheOptions);
      const ttl = cacheOptions.ttlSeconds ?? 60;
      await Rclient.set(key, JSON.stringify(result), { EX: ttl });
      console.log("Cached result for key:", key, "with TTL:", ttl);
    }
    return result;
  } catch (error) {
    console.error("Error executing query:", error);
    // Increment failure counter.
    queryFailureCounter.inc({ userId, queryType });
    throw error;
  }
}
