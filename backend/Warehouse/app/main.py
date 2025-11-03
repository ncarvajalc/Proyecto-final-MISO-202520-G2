from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from app.core.database import SessionLocal, engine, Base
from app.modules.warehouse.routes.warehouses import router as warehouse_router

from app.modules.inventory.routes.product_inventory import (
    router as product_inventory_router,
)

app = FastAPI(title="Warehouse Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(product_inventory_router)
app.include_router(warehouse_router)

# Create database tables after models are imported
Base.metadata.create_all(bind=engine)


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
