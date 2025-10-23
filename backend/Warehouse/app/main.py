from fastapi import FastAPI
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from app.core.database import SessionLocal, engine, Base

# Importar todos los modelos ANTES de crear las tablas
from app.modules.warehouse.models.warehouse_model import Warehouse

# Crear todas las tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Warehouse API",
    description="API para gestión de bodegas",
    version="1.0.0"
)

# Importar y registrar el router de warehouse
from app.modules.warehouse import warehouse_router
app.include_router(warehouse_router)


@app.get("/health", tags=["health"])
def healthcheck():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ok", "db": True}
    except OperationalError:
        return {"status": "error", "db": False}


@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI on Cloud Run!"}