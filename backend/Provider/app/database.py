from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Usar SQLite por defecto, pero permitir cambiar por variable de entorno
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./proveedores.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
# ✅ Esta es la función que faltaba
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()