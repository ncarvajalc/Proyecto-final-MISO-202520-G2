# Proyecto FastAPI en GCP (CI/CD)

Este proyecto implementa una aplicación **FastAPI** desplegada en **Google Cloud Run** usando **Cloud Build** como pipeline de Integración Continua (CI) y Despliegue Continuo (CD).

Cada vez que se hace un **push a `main`**, el flujo es automático:

1. Cloud Build ejecuta pruebas unitarias/estáticas.
2. Se construye una imagen Docker de la app.
3. La imagen se sube a Container Registry.
4. Se despliega la nueva versión en Cloud Run (sobre el mismo servicio).

---

## 🚀 Infraestructura utilizada

- **Google Cloud Build**: CI/CD (con trigger conectado a GitHub).
- **Google Container Registry**: almacenamiento de imágenes Docker.
- **Google Cloud Run**: servicio serverless para exponer la API públicamente.
- **FastAPI**: framework principal de la aplicación.

---

## 📂 Archivos importantes del repo

- `main.py` → aplicación FastAPI (incluye `/`, `/ping`, `/docs`).
- `requirements.txt` → dependencias de Python.
- `Dockerfile` → define cómo se construye la imagen.
- `cloudbuild.yaml` → pipeline de Cloud Build (test + build + deploy).
- `tests/test_basic.py` → prueba mínima para validar el build.

---

## 🔄 Flujo de CI/CD

1. **Commit y push a `main`**  
   GitHub dispara el **trigger de Cloud Build**.

2. **Pipeline (`cloudbuild.yaml`)**

   - Instala dependencias y corre `pytest`.
   - Construye y publica la imagen:  
     `gcr.io/<PROJECT_ID>/fastapi-app`.
   - Despliega en Cloud Run con acceso público.

3. **Despliegue automático**  
   El servicio se actualiza en la **misma URL**: https://fastapi-app-ywwjoj2ptq-uc.a.run.app

---

## ✅ Cómo probar la API

- Endpoint raíz:
  GET https://fastapi-app-ywwjoj2ptq-uc.a.run.app/

- Documentación Swagger: https://fastapi-app-ywwjoj2ptq-uc.a.run.app/docs

---

## 🔐 Reglas de trabajo con `main`

Para mantener la estabilidad del proyecto:

1. **No hacer commits directos a `main`.**

2. Crear una rama nueva para cada cambio:

```bash
git checkout -b feature/nueva-funcionalidad
```

3. Abrir un Pull Request (PR) → main.
4. El PR debe incluir:
   - Descripción clara del cambio.
   - Evidencia de que los tests locales pasan.
   - Revisiones de al menos 1 miembro del equipo.
5. Una vez aprobado, se mergea a main → lo que disparará el pipeline automáticamente.

## 🛠️ Comandos útiles

1. Probar la app localmente:

```bash
uvicorn main:app --reload --port 8080
```

2. Correr tests localmente:

```bash
pytest
```

## 📌 Notas

La URL de Cloud Run no cambia mientras se use el mismo nombre de servicio (fastapi-app).
Si necesitas otra URL, despliega con un nombre distinto de servicio.

---
