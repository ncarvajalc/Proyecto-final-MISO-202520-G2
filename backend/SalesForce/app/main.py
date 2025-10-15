from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
from app.core.database import SessionLocal, engine, Base

from app.modules.salespeople.routes import salespeople
from app.modules.salespeople.routes import salesplan

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return {"message": "Hello from FastAPI on Cloud Run!"}


app.include_router(salespeople.router)
app.include_router(salesplan.router)
