-- Create custom types for backup tracking
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'backup_type') THEN
    CREATE TYPE backup_type AS ENUM ('manual', 'automatic');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'backup_status') THEN
    CREATE TYPE backup_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
  END IF;
END $$;

drop table if exists backup_records CASCADE;

-- Create backup records table
CREATE TABLE backup_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  database_id INTEGER NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
  database_name VARCHAR(255) NOT NULL,
  
  -- Backup file details
  file_name VARCHAR(255),
  file_size BIGINT,
  file_path VARCHAR(255) ,
  checksum VARCHAR(64),  -- For integrity verification
  
  -- Backup metadata
  backup_type backup_type NOT NULL,
  status backup_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Storage details
  storage_location VARCHAR(255) ,  -- Could be 'local', 's3', etc.
  storage_path TEXT ,  -- Full path or URL to backup
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  deleted_at TIMESTAMPTZ,

  -- Metadata for extensibility
  metadata JSONB
);

-- Create indexes for common queries
CREATE INDEX idx_backup_records_user_id ON backup_records(user_id);
CREATE INDEX idx_backup_records_status ON backup_records(status);
CREATE INDEX idx_backup_records_created_at ON backup_records(created_at);
CREATE INDEX idx_backup_records_type ON backup_records(backup_type);
CREATE INDEX idx_backup_records_database ON backup_records(database_name);

-- Add documentation
COMMENT ON TABLE backup_records IS 'Tracks all database backup operations and their results';
COMMENT ON COLUMN backup_records.backup_type IS 'Whether backup was initiated manually or automatically';
COMMENT ON COLUMN backup_records.status IS 'Current status of the backup operation';
COMMENT ON COLUMN backup_records.checksum IS 'SHA-256 hash of the backup file for integrity verification';
COMMENT ON COLUMN backup_records.storage_location IS 'Where the backup is stored (local/s3/etc)';
COMMENT ON COLUMN backup_records.metadata IS 'Additional backup-specific information stored as JSON';