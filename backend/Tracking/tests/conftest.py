"""Pytest configuration and shared fixtures for Tracking tests."""

from __future__ import annotations

import os
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
TEST_DB_URL = f"sqlite:///{TEST_DB_PATH}"

os.environ.setdefault("TESTING", "1")
os.environ.setdefault("TEST_DATABASE_URL", TEST_DB_URL)

test_engine = create_engine(
    TEST_DB_URL, connect_args={"check_same_thread": False}
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
    # Prioritize the Tracking service root so imports resolve to the correct package
    if str(SERVICE_ROOT) in sys.path:
        sys.path.remove(str(SERVICE_ROOT))
    sys.path.insert(0, str(SERVICE_ROOT))

    # Clear cached modules so Tracking packages reload from the correct root
    for module_name in [
        name for name in list(sys.modules) if name == "app" or name.startswith("app.")
    ]:
        sys.modules.pop(module_name)

    from app.core.database import Base
    # Ensure ORM models are imported so metadata is populated before creating tables
    from app.modules.vehicles.models import vehicle as vehicle_models  # noqa: F401
    from app.modules.haul_route.models import route as route_models  # noqa: F401
    from app.modules.haul_route.models import route_stop as route_stop_models  # noqa: F401

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
