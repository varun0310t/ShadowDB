DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
    CREATE TYPE role AS ENUM ('owner', 'admin', 'user', 'readonly');
  END IF;
END $$;


DROP TABLE IF EXISTS user_databases CASCADE;


CREATE TABLE user_databases (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  database_id INTEGER REFERENCES databases(id) ON DELETE CASCADE,
  access_level role NOT NULL DEFAULT 'user',
  granted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, database_id)
);

CREATE INDEX idx_user_databases ON user_databases(user_id, database_id);