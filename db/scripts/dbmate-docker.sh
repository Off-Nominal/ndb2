#!/usr/bin/env bash
# Run dbmate in Docker so pg_dump matches the server (avoids Homebrew client 14 vs PG 16+ mismatch).
# Expects DATABASE_URL, DBMATE_*, etc. in the environment (e.g. dotenv -e .env.dev -- bash ./scripts/dbmate-docker.sh dump).
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

DB_URL="${DATABASE_URL//localhost/host.docker.internal}"
DB_URL="${DB_URL//127.0.0.1/host.docker.internal}"

# Pin to the same major line as package.json dbmate dependency when possible.
IMAGE="${DBMATE_DOCKER_IMAGE:-amacneil/dbmate:2}"

exec docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "$DIR:/workspace" \
  -w /workspace \
  -e "DATABASE_URL=$DB_URL" \
  -e "DBMATE_MIGRATIONS_DIR=${DBMATE_MIGRATIONS_DIR:-./migrations}" \
  -e "DBMATE_SCHEMA_FILE=${DBMATE_SCHEMA_FILE:-./schema.sql}" \
  "$IMAGE" \
  "$@"
