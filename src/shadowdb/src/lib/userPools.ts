import { Pool } from "pg";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const userPools = new Map<string, Pool[]>();

// Only track leader index by scope - this is more efficient

import {
  scopeLeaderIndex,
  leaderPoolIndex,
  checkAndUpdateLeader,
} from "./LeaderCheck";
import { get } from "http";

if (process.env.environment == "development") {
  checkAndUpdateLeader();
  console.log("dev mode");
}

console.log("leaderPoolIndex", leaderPoolIndex.value);

// Helper to extract scope from poolKey (userId:dbName:scope)
function getScopeFromKey(poolKey: string): string {
  const parts = poolKey.split(":");
  return parts.length >= 3 ? parts[2] : "default";
}

// Get pools for a specific poolKey
export function getUserPool(poolKey: string): Pool[] | undefined {
  return userPools.get(poolKey);
}

// Set a pool for a specific poolKey
export function setUserPool(poolKey: string, pool: Pool, index: number) {
  let pools = userPools.get(poolKey);

  if (!pools) {
    // Initialize new pool array
    pools = [];
    userPools.set(poolKey, pools);

    // Initialize leader index for this scope if not already set
    const scope = getScopeFromKey(poolKey);
    if (!scopeLeaderIndex.has(scope)) {
      scopeLeaderIndex.set(scope, 0);
    }
  }

  // Set the pool at the specified index
  pools[index] = pool;
}

// Remove pools for a specific key
export function removeUserPool(poolKey: string): void {
  const pools = userPools.get(poolKey);
  if (pools) {
    // Clean up connections before removing
    pools.forEach((pool) => pool?.end());
    userPools.delete(poolKey);

    // Check if any other pools use this scope
    const scope = getScopeFromKey(poolKey);
    let scopeStillInUse = false;

    for (const key of userPools.keys()) {
      if (getScopeFromKey(key) === scope && key !== poolKey) {
        scopeStillInUse = true;
        break;
      }
    }

    // Only remove scope leader index if no other pools use this scope
    if (!scopeStillInUse) {
      scopeLeaderIndex.delete(scope);
    }
  }
}

export function getAllUserPools(): Map<string, Pool[]> {
  return userPools;
}

// Get reader pool for a specific poolKey
export function getReaderPool(poolKey: string): Pool | undefined {
  const pools = userPools.get(poolKey);
  if (!pools || pools.length === 0) return undefined;

  const numPools = pools.length;
  if (numPools === 1) return pools[0]; // Only one pool available

  // Get leader index for this scope
  const scope = getScopeFromKey(poolKey);
  const leaderIdx = scopeLeaderIndex.get(scope) || 0;

  let readerIndex = Math.floor(Math.random() * numPools);
  if (readerIndex === leaderIdx) {
    readerIndex = (readerIndex + 1) % numPools;
  }

  console.log(`readerIndex for ${poolKey} (scope ${scope}): ${readerIndex}`);
  return pools[readerIndex];
}

// Get writer pool for a specific poolKey
export function getWriterPool(poolKey: string): Pool | undefined {
  const pools = userPools.get(poolKey);
  if (!pools || pools.length === 0) return undefined;

  // Get leader index for this scope
  const scope = getScopeFromKey(poolKey);
  const leaderIdx = scopeLeaderIndex.get(scope) || 0;

  console.log(`leaderIndex for ${poolKey} (scope ${scope}): ${leaderIdx}`);
  return pools[leaderIdx];
}

// Function to get the current leader pool
export function getLeaderPool(poolKey: string): Pool | undefined {
  const pools = userPools.get(poolKey);
  if (!pools || pools.length === 0) return undefined;

  const scope = getScopeFromKey(poolKey);
  const leaderIdx = scopeLeaderIndex.get(scope) || 0;

  return pools[leaderIdx];
}

// Set leader index for a specific scope
export function setScopeLeaderIndex(scope: string, index: number): void {
  scopeLeaderIndex.set(scope, index);
  console.log(`Updated leader index for scope ${scope} to ${index}`);
}

// For backward compatibility - sets global leader index
export function setLeaderPoolIndex(index: number): void {
  leaderPoolIndex.value = index;
  // Also update the default scope
  scopeLeaderIndex.set("default", index);
}

// Get default writer pool
export function getDefaultWriterPool(): Pool {
  const defaultKey = "default:default:shadowdb";
  const defaultPools = getUserPool(defaultKey);
  const leaderIdx = scopeLeaderIndex.get("shadowdb") || 0;

  const defaultPool = defaultPools?.[leaderIdx];
  if (!defaultPool) {
    throw new Error("Default writer pool not initialized");
  }
  return defaultPool;
}

// Get default reader pool
let lastReaderIndex = 0;
export function getDefaultReaderPool(): Pool {
  const defaultKey = "default:default:shadowdb";
  const defaultPools = getUserPool(defaultKey);

  if (!defaultPools || defaultPools.length <= 1) {
    throw new Error("Default reader pools not initialized");
  }

  const leaderIdx = scopeLeaderIndex.get("shadowdb") || 0;
  lastReaderIndex = (lastReaderIndex + 1) % defaultPools.length;

  // Skip leader index for reads
  if (lastReaderIndex === leaderIdx) {
    lastReaderIndex = (lastReaderIndex + 1) % defaultPools.length;
  }

  return defaultPools[lastReaderIndex];
}

// Get appropriate pool based on key and operation type
export function getAppropriatePool(
  poolKey: string | null,
  isWriter: boolean = false
): Pool {
  if (!poolKey || poolKey === "default:default:default") {
    return isWriter ? getDefaultWriterPool() : getDefaultReaderPool();
  }

  const pool = isWriter ? getWriterPool(poolKey) : getReaderPool(poolKey);

  if (!pool) {
    // Fallback to default pools if user-specific pools aren't available
    return isWriter ? getDefaultWriterPool() : getDefaultReaderPool();
  }

  return pool;
}

// Check leader status for all pools with the same scope
export async function checkAndUpdateScopeLeader(
  scope: string
): Promise<number> {
  // Find all pool keys that use this scope
  const keysWithScope = Array.from(userPools.keys()).filter(
    (key) => getScopeFromKey(key) === scope
  );

  if (keysWithScope.length === 0) {
    console.log(`No pools found for scope ${scope}`);
    return 0;
  }

  // Check all pools across all keys with this scope
  let foundLeader = false;
  let newLeaderIndex = 0;

  for (const key of keysWithScope) {
    const pools = userPools.get(key);
    if (!pools || pools.length <= 1) continue;

    for (let i = 0; i < pools.length; i++) {
      try {
        const result = await pools[i].query("SELECT pg_is_in_recovery()");
        const isReplica = result.rows[0].pg_is_in_recovery;

        if (!isReplica) {
          // This is the leader
          foundLeader = true;
          newLeaderIndex = i;

          if ((scopeLeaderIndex.get(scope) || 0) !== i) {
            console.log(`Found new leader for scope ${scope} at index ${i}`);
            scopeLeaderIndex.set(scope, i);
          }
          break;
        }
      } catch (error) {
        console.error(
          `Error checking leader status for pool ${i} of ${key}:`,
          error
        );
      }
    }

    if (foundLeader) break;
  }

  // If we couldn't identify the leader, keep using the current one
  return scopeLeaderIndex.get(scope) || 0;
}

// Initialize checking for all scopes periodically
export function initializeScopeChecks(intervalMs: number = 30000): void {
  setInterval(async () => {
    console.log("Checking leader status for all scopes...");

    // Get unique scopes
    const scopes = new Set<string>();
    for (const key of userPools.keys()) {
      scopes.add(getScopeFromKey(key));
    }

    // Check each scope
    for (const scope of scopes) {
      try {
        await checkAndUpdateScopeLeader(scope);
      } catch (error) {
        console.error(`Error checking scope ${scope}:`, error);
      }
    }
  }, intervalMs);
}

// For backward compatibility with the original API
export function getUserPoolLegacy(userId: string): Pool[] | undefined {
  // Find all pool keys that start with this userId
  const keysWithUserId = Array.from(userPools.keys()).filter((key) =>
    key.startsWith(`${userId}:`)
  );

  if (keysWithUserId.length === 0) return undefined;
  return userPools.get(keysWithUserId[0]);
}

export function getWriterPoolLegacy(userId: string): Pool | undefined {
  // Find all pool keys that start with this userId
  const keysWithUserId = Array.from(userPools.keys()).filter((key) =>
    key.startsWith(`${userId}:`)
  );

  if (keysWithUserId.length === 0) return undefined;
  return getWriterPool(keysWithUserId[0]);
}

export function getReaderPoolLegacy(userId: string): Pool | undefined {
  // Find all pool keys that start with this userId
  const keysWithUserId = Array.from(userPools.keys()).filter((key) =>
    key.startsWith(`${userId}:`)
  );

  if (keysWithUserId.length === 0) return undefined;
  return getReaderPool(keysWithUserId[0]);
}
