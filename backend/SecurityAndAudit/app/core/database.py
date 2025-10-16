"""Database session and engine configuration utilities."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings


SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine_kwargs: dict[str, object] = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Yield a database session ensuring proper closing."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
