from fastapi import FastAPI
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.core.database import SessionLocal
from app.modules.vehicles.routes import router as vehicles_router

app = FastAPI(title="Tracking Service", version="1.0.0")

# Include routers
app.include_router(vehicles_router)


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
    return {"message": "Tracking Service - FastAPI on Cloud Run!"}
