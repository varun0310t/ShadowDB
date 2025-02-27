import crypto from 'crypto';

export interface CacheOptions {
  cache?: boolean;       // whether caching is allowed
  ttlSeconds?: number;   // TTL for cached result
  queryId?: string;      // optional cache key override
  customKey?: string;    // any additional info to include in the key
}

export function getCacheKey(
  poolKey: string,       // Now using poolKey which is `${userId}:${dbName}`
  query: string, 
  params: any[] = [], 
  cacheOptions?: CacheOptions
): string {
  // If queryId is provided, use it directly
  if (cacheOptions?.queryId) {
    return `${poolKey}:cache:${cacheOptions.queryId}`;
  }
  
  // Otherwise, generate a hash of the query and params for a shorter key
  const queryHash = crypto.createHash('md5')
    .update(query + JSON.stringify(params))
    .digest('hex');
    
  // Include customKey if provided
  const customKeySuffix = cacheOptions?.customKey ? `:${cacheOptions.customKey}` : '';
  
  return `${poolKey}:cache:${queryHash}${customKeySuffix}`;
}

// Helper function to invalidate cache for a specific database
export async function invalidateDBCache(
  redis: any,
  userId: string,
  dbName: string
): Promise<number> {
  const pattern = `${userId}:${dbName}:cache:*`;
  const keys = await redis.keys(pattern);
  
  if (keys.length > 0) {
    await redis.del(...keys);
    console.log(`Invalidated ${keys.length} cache entries for user ${userId}, database ${dbName}`);
  }
  
  return keys.length;
}

// Helper function to invalidate all user caches
export async function invalidateUserCache(
  redis: any,
  userId: string
): Promise<number> {
  const pattern = `${userId}:*:cache:*`;
  const keys = await redis.keys(pattern);
  
  if (keys.length > 0) {
    await redis.del(...keys);
    console.log(`Invalidated ${keys.length} cache entries for user ${userId}`);
  }
  
  return keys.length;
}

// Helper to get TTL in seconds with defaults
export function getCacheTTL(cacheOptions?: CacheOptions): number {
  return cacheOptions?.ttlSeconds || 60; // Default 1 minute TTL
}