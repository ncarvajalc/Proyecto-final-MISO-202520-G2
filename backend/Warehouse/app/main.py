from fastapi import FastAPI
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.core.database import SessionLocal
from app.modules.inventory.routes import inventory

app = FastAPI(title="Warehouse Service")

# Include routers
app.include_router(inventory.router)


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
    return {"message": "Warehouse Service - Inventory Management"}
