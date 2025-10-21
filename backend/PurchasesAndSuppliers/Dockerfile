# Imagen base ligera
FROM python:3.14-slim

WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
COPY productos.csv .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar app
COPY ./app ./app

# Comando para correr FastAPI con Uvicorn usando el puerto que Cloud Run pasa
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001}"]
