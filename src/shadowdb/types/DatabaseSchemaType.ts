// Enum types that match PostgreSQL enum types
export enum TenancyType {
    SHARED = 'shared',
    ISOLATED = 'isolated'
  }
  
  export enum DatabaseStatus {
    CREATING = 'creating',
    RUNNING = 'running',
    STOPPED = 'stopped',
    ERROR = 'error',
    DELETED = 'deleted',
    HIBERNATED = 'hibernated'
  }
  
  // Database entity type
  export interface Database {
    id: number;
    name: string;
    tenancy_type: TenancyType;
    status: DatabaseStatus;
    error_message: string | null;
    owner_id: number;
    created_at: Date;
    updated_at: Date;
    
    // Physical instance details
    container_name: string | null;
    container_id: string | null;
    volume_name: string | null;
    port: number | null;
    connection_string: string | null;
    password: string | null;
    last_started_at: Date | null;
    last_stopped_at: Date | null;
  
    // Patroni-specific fields
    patroni_scope: string | null;
    patroni_port: number | null;
    parent_id: number | null;
    is_replica: boolean;
  
    // Reference to related services
    haproxy_id: number | null;
    querycacher_id: number | null;
    pgpool_id: number | null;
  
    // Storage related fields
    max_size_mb: number;
    current_size_mb: number;
    last_size_check: Date;
    read_only: boolean;
  
    // Resource related fields
    cpu_limit: number;
    memory_limit: number;
  }
  
  // For query results with joined user data
  export interface DatabaseWithUser extends Database {
    user_name?: string;
    user_email?: string;
  }
  
  // For creating a new database
  export interface CreateDatabaseInput {
    name: string;
    tenancy_type: TenancyType;
    owner_id: number;
    max_size_mb?: number;
    cpu_limit?: number;
    memory_limit?: number;
  }
  
  // For updating database properties
  export interface UpdateDatabaseInput {
    name?: string;
    status?: DatabaseStatus;
    error_message?: string | null;
    max_size_mb?: number;
    read_only?: boolean;
    cpu_limit?: number;
    memory_limit?: number;
  }
  
  // For replica creation
  export interface CreateReplicaInput {
    name: string;
    parent_id: number;
    owner_id: number;
  }
  
  // Related types from your schema
  
  export interface HaproxyInstance {
    id: number;
    container_name: string;
    container_id: string | null;
    port: number;
    status: string;
    created_at: Date;
    updated_at: Date;
  }
  
  export interface QuerycacherInstance {
    id: number;
    container_name: string;
    container_id: string | null;
    port: number;
    status: string;
    created_at: Date;
    updated_at: Date;
  }
  
  export interface PgpoolInstance {
    id: number;
    container_name: string;
    container_id: string | null;
    port: number;
    status: string;
    created_at: Date;
    updated_at: Date;
  }
  
  // User type referenced in the database schema
  export interface User {
    id: number;
    name: string | null;
    email: string;
    password: string | null;
    image: string | null;
    is_verified: boolean;
    provider: 'credentials' | 'google' | 'github';
    provider_id: string | null;
    created_at: Date;
  }