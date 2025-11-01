#!/bin/bash
set -e

echo "=================================="
echo "Starting Warehouse Service"
echo "=================================="

# Esperar a que la base de datos esté lista
max_retries=30
retry_interval=2


echo "Waiting for database..."
for i in $(seq 1 $max_retries); do
    if python - <<END
import sys
from sqlalchemy import create_engine, text
import os
try:
    database_url = os.getenv("DATABASE_URL")
    engine = create_engine(database_url)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
except:
    sys.exit(1)
END
    then
        echo "Database ready!"
        break
    else
        echo "Database not ready yet ($i/$max_retries), waiting..."
        sleep $retry_interval
    fi
done

# Inicializar DB (opcional)
echo "Initializing database tables..."
python -m app.core.init_db || true

echo "Seeding database with initial data..."
python -m app.core.seed_db || true

echo "Starting FastAPI..."
exec "$@"
