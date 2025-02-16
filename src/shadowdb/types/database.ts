import { Pool } from 'pg';
export interface ReplicaPools {
    writer: Pool;
    readers: Pool[];
  }