import os
import sys
from pathlib import Path
from typing import Generator

PROJECT_ROOT = Path(__file__).resolve().parents[1].parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) in sys.path:
    sys.path.remove(str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR))

import pytest
from faker import Faker
from backend.test_client import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

for module_name in [
    name for name in list(sys.modules) if name == "app" or name.startswith("app.")
]:
    sys.modules.pop(module_name)

TMP_DB_DIR = ROOT_DIR / "tests" / "tmp"
TMP_DB_DIR.mkdir(parents=True, exist_ok=True)
TEST_DB_PATH = TMP_DB_DIR / "purchases_test.db"

from app.core import database as db_module  # noqa: E402
from app.core.database import Base  # noqa: E402

sqlite_url = f"sqlite:///{TEST_DB_PATH}"
test_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
db_module.engine.dispose()
db_module.engine = test_engine
db_module.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

SessionLocal = db_module.SessionLocal
engine = db_module.engine
from app.main import app  # noqa: E402
from tests.products_test_app import Product, router as product_router  # noqa: E402
from tests.suppliers_test_app import Supplier, router as supplier_router  # noqa: E402


def _include_router_once() -> None:
    if not any(
        route.path == "/api/proveedores" and "POST" in route.methods
        for route in app.router.routes
    ):
        app.include_router(supplier_router)

    if not any(
        route.path == "/api/productos" and "POST" in route.methods
        for route in app.router.routes
    ):
        app.include_router(product_router)


@pytest.fixture()
def fake() -> Faker:
    faker = Faker()
    faker.seed_instance(1234)
    return faker


@pytest.fixture(scope="session", autouse=True)
def configure_database() -> Generator[None, None, None]:
    Base.metadata.create_all(bind=engine)
    _include_router_once()
    yield
    Base.metadata.drop_all(bind=engine)
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()


@pytest.fixture(autouse=True)
def clean_tables() -> Generator[None, None, None]:
    yield
    with SessionLocal() as session:
        session.query(Supplier).delete()
        session.query(Product).delete()
        session.commit()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    session: Session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def valid_supplier_payload(fake: Faker) -> dict:
    return {
        "nombre": fake.company(),
        "id_tax": fake.unique.msisdn(),
        "direccion": fake.address(),
        "telefono": fake.phone_number(),
        "correo": fake.unique.company_email(),
        "contacto": fake.name(),
        "estado": fake.random_element(("Activo", "Inactivo")),
        "certificado": None,
    }


@pytest.fixture
def valid_product_payload(fake: Faker) -> dict:
    specifications = [
        {"nombre": fake.word(), "valor": fake.sentence(nb_words=3)},
        {"nombre": fake.word(), "valor": fake.sentence(nb_words=2)},
    ]
    certifications = [fake.lexify(text="????").upper() for _ in range(2)]
    return {
        "sku": fake.unique.bothify(text="???-###"),
        "nombre": fake.catch_phrase(),
        "descripcion": fake.text(max_nb_chars=60),
        "precio": fake.random_int(min=1000, max=50000),
        "activo": fake.pybool(),
        "especificaciones": specifications,
        "hojaTecnica": {
            "urlManual": fake.url(),
            "urlHojaInstalacion": fake.url(),
            "certificaciones": certifications,
        },
    }


@pytest.fixture
def supplier_certificate_payload(fake: Faker) -> dict:
    certification_date = fake.date_between(start_date="-1y", end_date="today")
    expiration_date = fake.date_between(start_date="today", end_date="+1y")
    return {
        "nombre": fake.catch_phrase(),
        "cuerpoCertificador": fake.company(),
        "fechaCertificacion": certification_date.isoformat(),
        "fechaVencimiento": expiration_date.isoformat(),
        "urlDocumento": fake.url(),
    }
