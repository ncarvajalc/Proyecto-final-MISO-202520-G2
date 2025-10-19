import os
import sys
from pathlib import Path

import pytest
from faker import Faker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

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

engine = db_module.engine


@pytest.fixture(scope="session", autouse=True)
def configure_database() -> None:
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
