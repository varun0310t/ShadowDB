DROP TABLE IF EXISTS users;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
    CREATE TYPE role AS ENUM ('owner', 'admin', 'user', 'readonly');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'provider_type') THEN
    CREATE TYPE provider_type AS ENUM ('credentials', 'google', 'github', 'twitter');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE account_status AS ENUM ('active', 'suspended', 'deactivated', 'banned');
  END IF;
END $$;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255), -- Nullable for OAuth users
  
  -- Authentication fields
  provider provider_type NOT NULL DEFAULT 'credentials',
  provider_id VARCHAR(255), -- External provider's user ID
  image VARCHAR(255), -- User's avatar URL
  
  -- Email verification
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  verification_expires TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes'),

  -- Password reset
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMPTZ,
  last_password_change TIMESTAMPTZ,
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  status account_status DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  last_login_ip VARCHAR(45),
  
  -- Profile fields
  display_name VARCHAR(50),
  bio TEXT,
  location VARCHAR(100),
  timezone VARCHAR(50),
  language VARCHAR(10) DEFAULT 'en',
  company VARCHAR(100),
  website VARCHAR(255),
  github_username VARCHAR(39),
  twitter_username VARCHAR(15),
  
  -- Preferences
  email_notifications BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  theme VARCHAR(20) DEFAULT 'dark',

  --notification preferences
  Security_alert BOOLEAN DEFAULT true,
  Marketing_alert BOOLEAN DEFAULT true,
  Product_alert BOOLEAN DEFAULT true,
  Usage_alert BOOLEAN DEFAULT true,
  New_login_alert BOOLEAN DEFAULT true,
  
  
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  deleted_at TIMESTAMPTZ,

  --role password for database access
  role_password varchar(255), 

  -- Unique constraints
  CONSTRAINT unique_email_per_provider UNIQUE (email, provider),
  CONSTRAINT unique_provider_id UNIQUE (provider_id, provider)
);

-- Create custom type for account status if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE account_status AS ENUM ('active', 'suspended', 'deactivated', 'banned');
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX idx_users_provider ON users(provider);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;

CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_updated_at ON users(updated_at);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user account information and preferences';
COMMENT ON COLUMN users.status IS 'Current account status (active/suspended/deactivated/banned)';