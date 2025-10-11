from fastapi import FastAPI
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.core.database import SessionLocal
from app.modules.products.routes import bulk

app = FastAPI()

app.include_router(bulk.router)


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

