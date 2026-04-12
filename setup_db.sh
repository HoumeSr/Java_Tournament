#!/usr/bin/env bash

# ALERT: При существовании БД она будет пересоздана этим скриптом
# ./setup_db.sh localhost 5432 postgres postgres

set -euo pipefail

PGHOST="${1:-localhost}"
PGPORT="${2:-5432}"
PGUSER="${3:-postgres}"
PGPASSWORD="${4:-postgres}"

PGDBNAME="tournament_db" 

export PGPASSWORD

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql not found in PATH."
  exit 1
fi

echo "Host: $PGHOST"
echo "Port: $PGPORT"
echo "User: $PGUSER"
echo "Configuring PostgreSQL..."

psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';" 2>/dev/null || true

DB_EXISTS=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$PGDBNAME'")

if [[ "$DB_EXISTS" == "1" ]]; then
  echo "Database $PGDBNAME exists. Dropping it..."
  
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = '$PGDBNAME' AND pid <> pg_backend_pid();
  " 2>/dev/null || true
  
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "DROP DATABASE $PGDBNAME;"
  echo "Database $PGDBNAME dropped."
fi

echo "Creating database $PGDBNAME..."
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "CREATE DATABASE $PGDBNAME;"

echo "Done."
echo "Database: $PGDBNAME"
echo "User: $PGUSER"