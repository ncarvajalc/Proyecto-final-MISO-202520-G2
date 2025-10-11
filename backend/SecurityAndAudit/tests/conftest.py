import os
import sys
from pathlib import Path
from typing import Generator

import pytest
from sqlalchemy.orm import Session
from sqlmodel import SQLModel

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) in sys.path:
    sys.path.remove(str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR))

for module_name in [
    name for name in list(sys.modules) if name == "app" or name.startswith("app.")
]:
    sys.modules.pop(module_name)

os.environ.setdefault("TESTING", "1")

from app.core.database import SessionLocal, engine  # noqa: E402
from app.modules.access.models import (  # noqa: E402,F401
    User,
    Profile,
    Permission,
    ProfilePermission,
)


@pytest.fixture(scope="session", autouse=True)
def clean_database_file() -> Generator[None, None, None]:
    test_db = Path("test.db")
    if test_db.exists():
        test_db.unlink()
    yield
    if test_db.exists():
        test_db.unlink()


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    SQLModel.metadata.drop_all(bind=engine)
    SQLModel.metadata.create_all(bind=engine)

    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        SQLModel.metadata.drop_all(bind=engine)
        engine.dispose()
