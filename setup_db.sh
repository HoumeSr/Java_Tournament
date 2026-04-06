#!/usr/bin/env bash

# ./setup_db.sh localhost 5432 postgres postgres


set -euo pipefail

PGHOST="${1:-localhost}"
PGPORT="${2:-5432}"
PGUSER="${3:-postgres}"
PGPASSWORD="${4:-postgres}"

export PGPASSWORD

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql not found in PATH."
  exit 1
fi

echo "Host: $PGHOST"
echo "Port: $PGPORT"
echo "User: $PGUSER"
echo "Configuring PostgreSQL..."

psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"

DB_EXISTS=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='tournament_db'")

if [[ "$DB_EXISTS" != "1" ]]; then
  echo "Creating database tournament_db..."
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "CREATE DATABASE tournament_db;"
else
  echo "Database tournament_db already exists."
fi

echo "Done."
echo "Database: tournament_db"
echo "User: postgres"
echo "Password: postgres"