#!/bin/bash
set -e

echo "=================================="
echo "Starting Tracking Service"
echo "=================================="

# Esperar a que la base de datos esté lista
max_retries=30
retry_interval=2

echo "Waiting for database..."
for i in $(seq 1 $max_retries); do
    if python - <<END
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings
try:
    engine = create_engine(settings.DATABASE_URL)
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
python -m app.core.init_db || true
python -m app.core.seed_db || true

echo "Starting FastAPI..."
exec "$@"

