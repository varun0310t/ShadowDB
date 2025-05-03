export interface DatabaseEntry {
  id: number;
  tenancy_type: "shared" | "isolated";
  db_name: string;
  access_level: "admin" | "user";
  region?: string;
  created_at?: string;
  status?: "active" | "inactive" | "maintenance";
  db_user?: string;
  db_password?: string;
  haproxy?: {
    write_port?: number;
    read_port?: number;
  };
  pgpool?: {
    port?: number;
    enable_connection_pooling?: boolean;
    enable_query_cache?: boolean;
  };
}

export interface ConnectionConfigType {
  hostname: string;
  role_user: string;
  pgpool: {
    port: number;
    enable_connection_pooling: boolean;
    enable_query_cache: boolean;
  };
  haproxy: {
    write_port: number;
    read_port: number;
  };
  all_db_pools?: {id:number}[];
}
