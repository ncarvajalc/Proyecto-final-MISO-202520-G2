# Imagen base
FROM python:3.11-slim

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias
COPY requirementsProveedores.txt .
RUN pip install --no-cache-dir -r requirementsProveedores.txt

# Copiar el resto del código
COPY . .

# Puerto (Cloud Run usará PORT automáticamente)
ENV PORT=8080

# Ejecutar la app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
