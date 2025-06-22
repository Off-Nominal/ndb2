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
    echo "  $0 test    # Stop test database"
    echo "  $0 dev     # Stop development database"
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
        PORT=5435
        ;;
esac

export ENV PORT

echo "Stopping ${ENV} database..."

# Stop and remove containers using envsubst to process the template
docker compose --project-name ndb2 -f <(envsubst < "${SCRIPT_DIR}/docker-compose.template.yml") down -v

echo "${ENV} database stopped." 