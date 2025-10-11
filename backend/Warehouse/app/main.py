from fastapi import FastAPI
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.core.database import SessionLocal

app = FastAPI()


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
