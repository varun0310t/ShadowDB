CREATE TABLE user_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_type VARCHAR(20) NOT NULL, -- 'refresh', 'access', 'verification', etc.
  token VARCHAR(255) NOT NULL,
  device_info TEXT, -- Optional device/browser information
  ip_address VARCHAR(45), -- IPv4 or IPv6 address
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMPTZ,
  is_revoked BOOLEAN DEFAULT false,
  
  -- Indexes for performance
  CONSTRAINT unique_user_token UNIQUE (user_id, token),
  CONSTRAINT unique_token UNIQUE (token)
);

-- Create indexes for common queries
CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_token ON user_tokens(token);
CREATE INDEX idx_user_tokens_expires_at ON user_tokens(expires_at);