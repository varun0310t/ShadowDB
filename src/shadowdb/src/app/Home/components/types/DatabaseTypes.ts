export interface DatabaseEntry {
  id: number;
  tenancy_type: "shared" | "isolated";
  db_name: string;
  access_level: "admin" | "user";
  region?: string;
  created_at?: string;
  status?: "running" | "stopped" | "creating" | "error" | "deleted";
  db_user?: string;
  patroni_scope: string;
  db_password?: string;
  haproxy?:{
    write_port?: number;
    read_port?: number;
  };
  pgpool?:{
    port?: number;
    enable_query_cache?: boolean;
    enable_connection_pooling?: boolean;
  }
}

export interface TokenType {
  id: number;
  token: string;
  token_type: string;
  device_info: string | null;
  ip_address: string | null;
  created_at: string;
  expires_at: string;
  last_used_at: string | null;
  is_revoked: boolean;
}

export interface DatabaseConfigProps {
  databases: DatabaseEntry[];
}
