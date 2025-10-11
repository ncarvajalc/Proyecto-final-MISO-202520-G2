#!/bin/bash

# Entrypoint script for SecurityAndAudit service
# This script initializes the database and seeds it before starting the server

set -e

echo "=================================="
echo "SecurityAndAudit Service Starting"
echo "=================================="
echo ""

# Wait for database to be ready
echo "Waiting for database to be ready..."
python << END
import sys
import time
from sqlalchemy import create_engine, text
from app.core.config import settings

max_retries = 30
retry_interval = 2

for i in range(max_retries):
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Database is ready!")
        sys.exit(0)
    except Exception as e:
        if i < max_retries - 1:
            print(f"Database not ready yet (attempt {i+1}/{max_retries}), waiting...")
            time.sleep(retry_interval)
        else:
            print(f"Could not connect to database after {max_retries} attempts")
            sys.exit(1)
END

echo ""
echo "Initializing database tables..."
python -m app.core.init_db

echo ""
echo "Seeding database with initial data..."
python -m app.core.seed_db

echo ""
echo "=================================="
echo "Starting FastAPI server..."
echo "=================================="
echo ""

# Execute the main command (uvicorn server)
exec "$@"

