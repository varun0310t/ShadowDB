DROP TABLE IF EXISTS databases CASCADE;

-- Create enum for tenancy_type if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenancy_type') THEN
    CREATE TYPE tenancy_type AS ENUM ('shared', 'isolated');
  END IF;
END$$;


CREATE TABLE databases (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  tenancy_type tenancy_type NOT NULL DEFAULT 'shared',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_databases_name ON databases(name);
CREATE INDEX idx_databases_tenancy ON databases(tenancy_type);