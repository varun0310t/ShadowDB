import { Pool } from "pg"; // or your database library
import axios from "axios"; // for making HTTP requests

// Define the Map with proper typing
const userPools = new Map<string, Pool[]>();

// Global variable to store the index of the current leader pool
let leaderPoolIndex: number = 0;

export function getUserPool(userId: string): Pool[] | undefined {
  return userPools.get(userId);
}

export function setUserPool(userId: string, pool: Pool, index: number) {
  let pools = userPools.get(userId);

  if (!pools) {
    // Initialize new pool array with undefined values
    pools = [];
    userPools.set(userId, pools);
  }

  // Set the pool at the specified index
  pools[index] = pool;
}

export function removeUserPool(userId: string): void {
  const pools = userPools.get(userId);
  if (pools) {
    // Clean up connections before removing
    pools.forEach((pool) => pool?.end());
    userPools.delete(userId);
  }
}

export function getAllUserPools(): Map<string, Pool[]> {
  return userPools;
}

export function getReaderPool(userId: string): Pool | undefined {
  const pools = userPools.get(userId);
  if (!pools || pools.length === 0) return undefined;

  const numPools = pools.length;
  if (numPools === 1) return pools[0]; // Only one pool available

  let readerIndex = Math.floor(Math.random() * numPools);
  if (readerIndex === leaderPoolIndex) {
    readerIndex = (readerIndex + 1) % numPools;
  }

  return pools[readerIndex];
}

export function getWriterPool(userId: string): Pool | undefined {
  const pools = userPools.get(userId);
  if (!pools || pools.length === 0) return undefined;

  // Return the leader pool
  return pools[leaderPoolIndex];
}

// Function to get the current leader pool for a user
export function getLeaderPool(userId: string): Pool | undefined {
  const pools = userPools.get(userId);
  if (!pools || pools.length === 0) return undefined;

  return pools[leaderPoolIndex];
}

// Function to set the current leader pool index
export function setLeaderPoolIndex(index: number): void {
  leaderPoolIndex = index;
}

// Fix the getDefaultWriterPool function
export function getDefaultWriterPool(): Pool {
  const defaultPool = getUserPool('default')?.[0];
  if (!defaultPool) {
    throw new Error('Default writer pool not initialized');
  }
  return defaultPool;
}

// Fix the getDefaultReaderPool function
let lastReaderIndex = 0;
export function getDefaultReaderPool(): Pool {
  const defaultPools = getUserPool('default');
  if (!defaultPools || defaultPools.length <= 1) {
    throw new Error('Default reader pools not initialized');
  }
  
  lastReaderIndex = ((lastReaderIndex + 1) % (defaultPools.length - 1)) + 1;
  return defaultPools[lastReaderIndex];
}

// Fix the getAppropriatePool function
export function getAppropriatePool(userId: string | null, isWriter: boolean): Pool {
  if (!userId || userId === 'default') {
    return isWriter ? getDefaultWriterPool() : getDefaultReaderPool();
  }
  const pool = isWriter ? getWriterPool(userId) : getReaderPool(userId);
  if (!pool) {
    // Fallback to default pools if user-specific pools aren't available
    return isWriter ? getDefaultWriterPool() : getDefaultReaderPool();
  }
  return pool;
}

