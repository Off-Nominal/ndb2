#!/bin/bash
set -e

echo "Stopping test database..."

# Stop and remove containers
docker compose down

# Optionally remove volumes (uncomment to completely reset)
# docker compose down -v

echo "Test database stopped." 