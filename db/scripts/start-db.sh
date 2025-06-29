#!/bin/bash
set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if environment is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <environment>"
    echo "  environment: test, dev, or any other environment name"
    echo ""
    echo "Examples:"
    echo "  $0 test    # Start test database"
    echo "  $0 dev     # Start development database"
    exit 1
fi

ENV=$1

# Environment-specific configurations
case $ENV in
    "test")
        PORT=5433
        ;;
    "dev")
        PORT=5434
        ;;
    *)
        # For custom environments, use a port starting from 5435
        # You can customize this logic as needed
        PORT=5435
        ;;
esac

# Set SCHEMA_PATH to the absolute path of schema.sql
SCHEMA_PATH="$(cd "$SCRIPT_DIR/../" && pwd)/schema.sql"
export ENV PORT SCHEMA_PATH

echo "Starting ${ENV} database..."

# Start the database using envsubst to process the template
docker compose --project-name ndb2 -f <(envsubst < "${SCRIPT_DIR}/docker-compose.template.yml") up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
until docker compose --project-name ndb2 -f <(envsubst < "${SCRIPT_DIR}/docker-compose.template.yml") exec -T ndb2-${ENV}-database pg_isready -U ${ENV}_user -d ndb2_${ENV}; do
  echo "Database is not ready yet. Waiting..."
  sleep 2
done

# Check if the 'users' table exists
TABLE_EXISTS=$(docker compose --project-name ndb2 -f <(envsubst < "${SCRIPT_DIR}/docker-compose.template.yml") exec -T ndb2-${ENV}-database psql -U ${ENV}_user -d ndb2_${ENV} -tAc "SELECT to_regclass('public.users') IS NOT NULL;")

if [ "$TABLE_EXISTS" = "t" ]; then
  echo "Database already initialized. Skipping schema load."
else
  echo "Loading database schema..."
  # Copy schema file to container and run it
  docker compose --project-name ndb2 -f <(envsubst < "${SCRIPT_DIR}/docker-compose.template.yml") exec -T ndb2-${ENV}-database psql -U ${ENV}_user -d ndb2_${ENV} -f - < "${SCHEMA_PATH}"
fi

echo "${ENV} database is ready!"
echo "Connection details:"
echo "  Host: localhost"
echo "  Port: ${PORT}"
echo "  Database: ndb2_${ENV}"
echo "  Username: ${ENV}_user"
echo "  Password: ${ENV}_password"
echo "  Connection URL: postgresql://${ENV}_user:${ENV}_password@localhost:${PORT}/ndb2_${ENV}"
