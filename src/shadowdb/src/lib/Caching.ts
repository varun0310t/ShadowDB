export interface CacheOptions {
    cache?: boolean;       // whether caching is allowed
    ttlSeconds?: number;   // TTL for cached result
    queryId?: string;      // optional cache key override
  }

 export function getCacheKey(userId: string, query: string, params: any[], cacheOptions?: CacheOptions): string {
    if (cacheOptions?.queryId) {
      return `${userId}:cache:${cacheOptions.queryId}`;
    }
    return `${userId}:cache:${query}:${JSON.stringify(params)}`;
  }