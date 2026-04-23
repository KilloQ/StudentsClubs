#!/usr/bin/env bash
set -e

echo "Waiting for Postgres..."
MAX_RETRIES=30
RETRY_COUNT=0
until pg_isready -h "${POSTGRES_HOST:-postgres}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-postgres}" >/dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT+1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "Postgres did not become available in time"
    exit 1
  fi
  sleep 1
done

echo "Running DB init (create tables/migrations)..."
python -m app.db.init_db || true

echo "Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
