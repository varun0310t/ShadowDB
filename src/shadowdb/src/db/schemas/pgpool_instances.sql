drop table if exists pgpool_instances cascade;

-- Create table to track PgPool-II instances

CREATE TABLE IF NOT EXISTS pgpool_instances (
  id SERIAL PRIMARY KEY,
  cluster_name VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL,
  container_name VARCHAR(255) NOT NULL,
  container_id VARCHAR(255) NOT NULL,
  volume_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'creating',
  enable_query_cache BOOLEAN NOT NULL DEFAULT TRUE,
  enable_load_balancing BOOLEAN NOT NULL DEFAULT TRUE,
  enable_connection_pooling BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  haproxy_id INTEGER REFERENCES haproxy_instances(id) ON DELETE CASCADE
);
