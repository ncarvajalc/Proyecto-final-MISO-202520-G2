"""Pytest configuration and shared fixtures for Tracking tests."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
from faker import Faker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.test_client import TestClient

CURRENT_DIR = Path(__file__).resolve().parent
SERVICE_ROOT = CURRENT_DIR.parent
PROJECT_ROOT = SERVICE_ROOT.parent.parent

for path in (PROJECT_ROOT, SERVICE_ROOT):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

for module_name in [
    name for name in list(sys.modules) if name == "app" or name.startswith("app.")
]:
    sys.modules.pop(module_name)

TMP_DB_DIR = CURRENT_DIR / "tmp"
TMP_DB_DIR.mkdir(parents=True, exist_ok=True)
TEST_DB_PATH = TMP_DB_DIR / "tracking_test.db"

test_engine = create_engine(
    f"sqlite:///{TEST_DB_PATH}", connect_args={"check_same_thread": False}
)

from app.core import database as db_module  # noqa: E402

db_module.engine.dispose()
db_module.engine = test_engine
db_module.SessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine
)

from app.main import app  # noqa: E402


@pytest.fixture()
def fake() -> Faker:
    """Return a ``Faker`` instance with a clean ``unique`` cache."""

    faker = Faker()
    faker.unique.clear()
    return faker


@pytest.fixture(scope="session", autouse=True)
def configure_database() -> None:
    from app.core.database import Base

    Base.metadata.create_all(bind=db_module.engine)
    yield
    Base.metadata.drop_all(bind=db_module.engine)
    db_module.engine.dispose()
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()


@pytest.fixture(autouse=True)
def reset_database():
    from app.core.database import Base

    Base.metadata.drop_all(bind=db_module.engine)
    Base.metadata.create_all(bind=db_module.engine)
    with db_module.engine.begin() as connection:
        for table in reversed(Base.metadata.sorted_tables):
            connection.execute(table.delete())
    yield
    Base.metadata.drop_all(bind=db_module.engine)


@pytest.fixture()
def db_session(reset_database):
    session = db_module.SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(reset_database):
    with TestClient(app) as test_client:
        yield test_client
