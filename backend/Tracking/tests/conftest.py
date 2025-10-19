import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1].parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) in sys.path:
    sys.path.remove(str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR))

import pytest
from faker import Faker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

for module_name in [
    name for name in list(sys.modules) if name == "app" or name.startswith("app.")
]:
    sys.modules.pop(module_name)

TMP_DB_DIR = ROOT_DIR / "tests" / "tmp"
TMP_DB_DIR.mkdir(parents=True, exist_ok=True)
TEST_DB_PATH = TMP_DB_DIR / "tracking_test.db"

from app.core import database as db_module  # noqa: E402

sqlite_url = f"sqlite:///{TEST_DB_PATH}"
test_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
db_module.engine.dispose()
db_module.engine = test_engine
db_module.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture()
def fake() -> Faker:
    faker = Faker()
    faker.seed_instance(7)
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
