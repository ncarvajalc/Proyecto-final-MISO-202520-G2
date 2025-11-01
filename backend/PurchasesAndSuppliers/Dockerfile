# Imagen base ligera
FROM python:3.14-slim

WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
COPY productos.csv .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar app y entrypoint script
COPY ./app ./app
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]

# CMD usando forma shell para que se expanda $PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001}"]
