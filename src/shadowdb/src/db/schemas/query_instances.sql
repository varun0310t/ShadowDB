
DROP TABLE IF EXISTS querycacher_instances CASCADE;

CREATE TABLE querycacher_instances (
  id SERIAL PRIMARY KEY,
  cluster_name VARCHAR(255) NOT NULL UNIQUE,
  port INTEGER NOT NULL,
  container_name VARCHAR(255) NOT NULL UNIQUE,
  container_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'creating',
  cache_size VARCHAR(50) DEFAULT '256MB',
  ttl INTEGER DEFAULT 60,
  haproxy_id INTEGER REFERENCES haproxy_instances(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);