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
docker compose exec -T ndb2-test-database psql -U test_user -d ndb2_test -f /docker-entrypoint-initdb.d/01-schema.sql

# Load the seed data
echo "Loading seed data..."
docker compose exec -T ndb2-test-database psql -U test_user -d ndb2_test -f /docker-entrypoint-initdb.d/02-seed.sql

echo "Test database is ready!"
echo "Connection details:"
echo "  Host: localhost"
echo "  Port: 5433"
echo "  Database: ndb2_test"
echo "  Username: test_user"
echo "  Password: test_password"
echo "  Connection URL: postgresql://test_user:test_password@localhost:5433/ndb2_test"
echo ""
echo "Test users created:"
echo "  - test-user-1 (ID: 550e8400-e29b-41d4-a716-446655440001)"
echo "  - test-user-2 (ID: 550e8400-e29b-41d4-a716-446655440002)" 