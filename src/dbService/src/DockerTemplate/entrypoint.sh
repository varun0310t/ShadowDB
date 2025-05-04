#!/bin/bash
set -e

# Fix permissions at runtime
chown -R postgres:postgres /var/lib/postgresql/data
chmod 700 /var/lib/postgresql/data

# Execute command as postgres user
exec gosu postgres "$@"