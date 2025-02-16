import { Pool } from "pg";

// A map to hold dedicated user pools keyed by user ID
const userPools = new Map<string, Pool>();

export function getUserPool(userId: string): Pool | undefined {
  return userPools.get(userId);
}

export function setUserPool(userId: string, pool: Pool): void {
  userPools.set(userId, pool);
}

export function removeUserPool(userId: string): void {
  userPools.delete(userId);
}

export function getAllUserPools(): Map<string, Pool> {
  return userPools;
}