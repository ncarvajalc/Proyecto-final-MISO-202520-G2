# Imagen base ligera
FROM python:3.14-slim

# Configuración del contenedor
WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar app y entrypoint script
COPY ./app ./app
COPY entrypoint.sh /app/entrypoint.sh

# Hacer el entrypoint ejecutable
RUN chmod +x /app/entrypoint.sh

# Usar el entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]

# Comando para correr FastAPI con Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
