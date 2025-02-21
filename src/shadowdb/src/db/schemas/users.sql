-- Create enum for tenancy_type if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenancy_type') THEN
    CREATE TYPE tenancy_type AS ENUM ('shared', 'isolated');
  END IF;
END$$;

-- Create enum for role if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
    CREATE TYPE role AS ENUM ('admin', 'user');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Store hashed passwords in production
  
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  verification_expires TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes'),

  tenancy_type tenancy_type NOT NULL DEFAULT 'shared',  -- For Hybrid Multi-Tenancy
  db_name VARCHAR(100),  -- Only needed if tenancy_type is 'isolated'
  role role NOT NULL DEFAULT 'user',  -- Access Control
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);