DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'provider_type') THEN
    CREATE TYPE provider_type AS ENUM ('credentials', 'google', 'github');
  END IF;
END$$;



-- Create enum for role if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
    CREATE TYPE role AS ENUM ('admin', 'user');
  END IF;
END$$;

DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255), -- Nullable for OAuth users
  
  provider provider_type NOT NULL DEFAULT 'credentials',
  provider_id VARCHAR(255), -- External provider's user ID
  image VARCHAR(255), -- User's avatar URL
  
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  verification_expires TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes'),


  role role NOT NULL DEFAULT 'user',  -- Access Control
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  -- Unique constraints
  CONSTRAINT unique_email_per_provider UNIQUE (email, provider),
  CONSTRAINT unique_provider_id UNIQUE (provider_id, provider)
);

-- Create indexes for better query performance
CREATE INDEX idx_provider ON users(provider);
CREATE INDEX idx_email ON users(email);