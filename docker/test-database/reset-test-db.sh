#!/bin/bash
set -e

echo "Resetting test database..."

# Stop and remove everything
docker compose down -v

# Rebuild and start fresh
docker compose up -d --build

# Wait for database to be ready
echo "Waiting for database to be ready..."
until docker compose exec -T ndb2-test-database pg_isready -U test_user -d ndb2_test; do
  echo "Database is not ready yet. Waiting..."
  sleep 2
done

echo "Test database has been reset and is ready!" 