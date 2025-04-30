DROP TABLE IF EXISTS haproxy_instances CASCADE;
-- HAProxy Table
CREATE TABLE haproxy_instances (
  id SERIAL PRIMARY KEY,
  cluster_name VARCHAR(255) NOT NULL UNIQUE,
  write_port INTEGER NOT NULL,
  read_port INTEGER NOT NULL,
  container_name VARCHAR(255) NOT NULL UNIQUE,
  container_id VARCHAR(255),
  volume_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'creating',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

