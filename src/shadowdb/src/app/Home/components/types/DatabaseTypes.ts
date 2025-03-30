export interface DatabaseEntry {
  id: number;
  tenancy_type: "shared" | "isolated";
  db_name: string;
  access_level: "admin" | "user";
  region?: string;
  created_at?: string;
  status?: "active" | "inactive" | "maintenance";
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
