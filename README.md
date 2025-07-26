
# ShadowDB

> **Enterprise PostgreSQL Database Management Platform**

ShadowDB is a comprehensive, enterprise-grade PostgreSQL database management platform that combines high availability clustering, containerized deployments, and a modern web interface to provide developers and organizations with a robust database-as-a-service solution.

## ✨ Features

### 🏗️ High Availability Architecture
- **Patroni-powered clustering** with automatic failover and distributed consensus
- **Multi-node replication** (1 primary & 2+ read replicas)
- **Zero-downtime failover** and automatic leader election

### 🐳 Containerized Infrastructure
- Docker-based deployment powered by Docker Compose
- etcd for distributed configuration with RAFT consensus
- HAProxy for intelligent load balancing
- PgPool-II for connection pooling and query routing
- Persistent storage volumes for data durability

### 🖥️ Modern Web Interface
- Built with Next.js 15 and TypeScript
- Feature-rich dashboard with query execution support (Monaco Editor)
- Real-time system metrics & resource monitoring
- Multi-tenancy: create isolated or shared databases

### 🔧 Database Management
- One-click database provisioning and management
- View, execute, and debug SQL queries straight from the browser
- Manage backups, restores, and PostgreSQL configuration
- User and role management with detailed permissions


## 📊 Features Overview

### Create and Manage Databases

- Tenancy Management: Shared/Isolated options
- Live database status, storage usage, and meta info
- Add/remove databases easily via UI

### Query Editor

- Monaco-powered SQL editor with syntax highlighting
- Save and reuse query snippets
- Export query results as CSV or JSON

### High Availability & Failover

- Real-time failover handling via Patroni
- Primary detection and switchover via HAProxy
- Auto-promotion of replica nodes

### Monitoring & Observability

- View query metrics, CPU/Memory/IO stats
- Slow query logs and database health panel
- Connection pool stats (via PgPool)



## 🎯 Use Cases

✅ **Development Environments**  
Rapid provisioning, test databases, schema experimentation

✅ **Production Systems**  
Highly available fleet of PostgreSQL databases, replica-based read scaling

✅ **Multi-Tenant SaaS Apps**  
Create logical databases per tenant with shared or isolated tenancy

## 🔒 Security

- Role-based access control (RBAC)
- Secure PostgreSQL roles and connection credentials
- TLS support for connections (configurable)
- Isolated Docker networks

