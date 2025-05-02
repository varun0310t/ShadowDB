-- Types for database states
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenancy_type') THEN
    CREATE TYPE tenancy_type AS ENUM ('shared', 'isolated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'database_status') THEN
    CREATE TYPE database_status AS ENUM ('creating', 'running', 'stopped', 'error', 'deleted', 'hibernated');
  END IF;
END$$;

-- Main database table that represents logical databases
DROP TABLE IF EXISTS databases CASCADE;
CREATE TABLE databases (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- Removed UNIQUE constraint
  tenancy_type tenancy_type NOT NULL DEFAULT 'isolated', -- Type of database (shared or isolated)
  status database_status NOT NULL DEFAULT 'creating',
  error_message TEXT,
  owner_id INTEGER REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Physical instance details (for isolated databases)
  container_name VARCHAR(255),
  container_id VARCHAR(255),
  volume_name VARCHAR(255),
  port INTEGER,
  connection_string TEXT,
  password VARCHAR(255),
  last_started_at TIMESTAMP,
  last_stopped_at TIMESTAMP,

  -- Patroni-specific fields
  patroni_scope VARCHAR(255),       -- Unique scope identifier for Patroni cluster
  patroni_port INTEGER,             -- Port for Patroni REST API
  parent_id INTEGER REFERENCES databases(id), -- Reference to primary if this is a replica
  is_replica BOOLEAN DEFAULT false,  -- Whether this is a replica instance

  -- reference to the haproxy instance and querycacher instance
  haproxy_id INTEGER REFERENCES haproxy_instances(id) ON DELETE CASCADE,
  querycacher_id INTEGER REFERENCES querycacher_instances(id) ON DELETE CASCADE,
  pgpool_id INTEGER REFERENCES pgpool_instances(id) ON DELETE SET NULL,

  --strogae related fields
  max_size_mb INTEGER DEFAULT 512,
  current_size_mb INTEGER default 10,
  last_size_check TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  read_only BOOLEAN DEFAULT false, -- Whether the database is read-only

  --resoures related fields
  cpu_limit INTEGER DEFAULT 1, -- CPU limit for the database instance
  memory_limit INTEGER DEFAULT 512 -- Memory limit for the database instance (in MB)
);

-- Partial unique index for shared databases only
CREATE UNIQUE INDEX idx_shared_database_names ON databases(name) 
WHERE tenancy_type = 'shared';

-- Other indexes
CREATE INDEX idx_databases_name ON databases(name);
CREATE INDEX idx_databases_tenancy ON databases(tenancy_type);
CREATE INDEX idx_databases_owner ON databases(owner_id);
CREATE INDEX idx_databases_status ON databases(status);
CREATE INDEX idx_databases_container ON databases(container_name) WHERE container_name IS NOT NULL;
CREATE INDEX idx_databases_patroni_scope ON databases(patroni_scope) WHERE patroni_scope IS NOT NULL;
CREATE INDEX idx_databases_parent ON databases(parent_id) WHERE parent_id IS NOT NULL;