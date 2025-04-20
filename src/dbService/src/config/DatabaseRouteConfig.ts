export const generatePatroniConfig = (
  scope: string,
  namespace: string,
  pgPort: number,
  restApiPort: number,
  password: string
) => `
  scope: ${scope}
  namespace: ${namespace}
  name: ${scope}
  
  restapi:
    listen: 0.0.0.0:${restApiPort}
    connect_address: localhost:${restApiPort}
  
  etcd:
    hosts: etcd:2379
  
  bootstrap:
    dcs:
      ttl: 30
      loop_wait: 10
      retry_timeout: 10
      maximum_lag_on_failover: 1048576
      postgresql:
        use_pg_rewind: true
        parameters:
          max_connections: 100
          shared_buffers: 256MB
          wal_level: replica
          hot_standby: "on"
          max_wal_senders: 10
          max_replication_slots: 10
          wal_keep_segments: 8
  
  postgresql:
    listen: 0.0.0.0:${pgPort}
    connect_address: localhost:${pgPort}
    data_dir: /var/lib/postgresql/data
    pgpass: /tmp/pgpass
    authentication:
      replication:
        username: replicator
        password: ${password}
      superuser:
        username: postgres
        password: ${password}
    parameters:
      unix_socket_directories: /var/run/postgresql
  `;

export const DB_CONFIG = {
  basePort: 5567, // PostgreSQL port
  patroniBasePort: 8023, // Patroni API port
  networkName: "shadowdb-network", // Docker network name
  volumeBasePath: "/var/lib/postgresql/data", // Base path for volumes
  etcdUrl: "http://etcd:2379", // Central etcd service
  patroniImage: "registry.opensource.zalan.do/acid/spilo-15:3.0-p1", // Patroni image
};
