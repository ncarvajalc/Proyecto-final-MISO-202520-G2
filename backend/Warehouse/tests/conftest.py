import os
import sys
from pathlib import Path
from typing import Generator

import pytest
from faker import Faker
from backend.test_client import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

PROJECT_ROOT = Path(__file__).resolve().parents[1].parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) in sys.path:
    sys.path.remove(str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR))

TMP_DB_DIR = ROOT_DIR / "tests" / "tmp"
TMP_DB_DIR.mkdir(parents=True, exist_ok=True)
TEST_DB_PATH = TMP_DB_DIR / "warehouse_test.db"

from app.core import database as db_module  # noqa: E402
from app.core.database import Base  # noqa: E402

sqlite_url = f"sqlite:///{TEST_DB_PATH}"
test_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
db_module.engine.dispose()
db_module.engine = test_engine
db_module.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

SessionLocal = db_module.SessionLocal
engine = db_module.engine


@pytest.fixture(scope="session", autouse=True)
def configure_database() -> Generator[None, None, None]:
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()


@pytest.fixture()
def fake() -> Faker:
    faker = Faker()
    faker.seed_instance(21)
    return faker


@pytest.fixture
def client() -> TestClient:
    if str(ROOT_DIR) in sys.path:
        sys.path.remove(str(ROOT_DIR))
    sys.path.insert(0, str(ROOT_DIR))
    for module_name, module in list(sys.modules.items()):
        if module_name.startswith("app.core"):
            continue
        if module_name == "app" or module_name.startswith("app."):
            module_file = getattr(module, "__file__", "")
            if not module_file or str(ROOT_DIR) not in module_file:
                sys.modules.pop(module_name)
    from app.main import app  # noqa: E402
    return TestClient(app)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    session: Session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
