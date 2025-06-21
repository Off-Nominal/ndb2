#!/bin/bash
set -e

echo "Starting test database..."

# Start the test database
docker compose up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
until docker compose exec -T ndb2-test-database pg_isready -U test_user -d ndb2_test; do
  echo "Database is not ready yet. Waiting..."
  sleep 2
done

# Load the schema
echo "Loading database schema..."
docker compose exec -T ndb2-test-database psql -U test_user -d ndb2_test -f /docker-entrypoint-initdb.d/schema.sql

echo "Test database is ready!"
echo "Connection details:"
echo "  Host: localhost"
echo "  Port: 5433"
echo "  Database: ndb2_test"
echo "  Username: test_user"
echo "  Password: test_password"
echo "  Connection URL: postgresql://test_user:test_password@localhost:5433/ndb2_test" 