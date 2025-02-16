import { Pool } from "pg"; // or your database library
import { ReplicaPools } from "../types/database";

// Define the Map with proper typing
const userPools = new Map<string, ReplicaPools>();

export function getUserPool(userId: string): ReplicaPools | undefined {
  return userPools.get(userId);
}

export function setUserPool(
  userId: string,
  pool: Pool,
  isReplica: boolean = false
) {
  let pools = userPools.get(userId);

  if (!pools) {
    // Initialize new replica structure
    pools = {
      writer: isReplica ? (null as unknown as Pool) : pool,
      readers: isReplica ? [pool] : [],
    };
    userPools.set(userId, pools);
  } else {
    if (isReplica) {
      pools.readers.push(pool);
    } else {
      pools.writer = pool;
    }
  }
}

export function removeUserPool(userId: string): void {
  const pools = userPools.get(userId);
  if (pools) {
    // Clean up connections before removing
    pools.writer?.end();
    pools.readers.forEach((reader) => reader.end());
    userPools.delete(userId);
  }
}

export function getAllUserPools(): Map<string, ReplicaPools> {
  return userPools;
}

export function getReaderPool(userId: string): Pool | undefined {
  const pools = userPools.get(userId);
  if (!pools) return undefined;

  if (pools.readers.length > 0) {
    const readerIndex = Math.floor(Math.random() * pools.readers.length);
    return pools.readers[readerIndex];
  }
  return pools.writer;
}

export function getWriterPool(userId: string): Pool | undefined {
  const pools = userPools.get(userId);
  if (!pools) return undefined;
  return pools.writer;
}
