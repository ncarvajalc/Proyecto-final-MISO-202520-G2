FROM python:3.14-slim

WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar app y entrypoint
COPY ./app ./app
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

# ENTRYPOINT usa el script que maneja el PORT dinámico
ENTRYPOINT ["/app/entrypoint.sh"]
