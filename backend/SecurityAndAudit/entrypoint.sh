#!/bin/bash
set -e

echo "=================================="
echo "SecurityAndAudit Service Starting"
echo "=================================="
echo ""

# Revisar que DATABASE_URL esté configurada
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: La variable DATABASE_URL no está configurada"
    exit 1
fi

# Esperar a que la base de datos esté lista
echo "Waiting for database to be ready..."
python << END
import sys
import time
from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv("DATABASE_URL")
max_retries = 30
retry_interval = 2

for i in range(max_retries):
    try:
        engine = create_engine(DATABASE_URL)
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

# Ejecutar el comando principal (uvicorn)
exec "$@"
