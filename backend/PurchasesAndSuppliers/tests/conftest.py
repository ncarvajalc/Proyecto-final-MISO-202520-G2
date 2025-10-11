import os
import sys
from pathlib import Path
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) in sys.path:
    sys.path.remove(str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR))

for module_name in [
    name for name in list(sys.modules) if name == "app" or name.startswith("app.")
]:
    sys.modules.pop(module_name)

os.environ.setdefault("TESTING", "1")

from app.core.database import Base, SessionLocal, engine  # noqa: E402
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


@pytest.fixture(scope="session", autouse=True)
def configure_database() -> Generator[None, None, None]:
    Base.metadata.create_all(bind=engine)
    _include_router_once()
    yield
    Base.metadata.drop_all(bind=engine)
    test_db = Path("test.db")
    if test_db.exists():
        test_db.unlink()


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
def valid_supplier_payload() -> dict:
    return {
        "nombre": "Proveedor Uno",
        "id_tax": "12345",
        "direccion": "Calle 123",
        "telefono": "5551234",
        "correo": "contacto@proveedor.com",
        "contacto": "Ana Pérez",
        "estado": "Activo",
        "certificado": None,
    }


@pytest.fixture
def valid_product_payload() -> dict:
    return {
        "sku": "MED-900",
        "nombre": "Producto de prueba",
        "descripcion": "Descripción de producto",
        "precio": 15000,
        "activo": True,
        "especificaciones": [
            {"nombre": "Presentación", "valor": "Caja x 10"},
            {"nombre": "Concentración", "valor": "500mg"},
        ],
        "hojaTecnica": {
            "urlManual": "https://example.com/manual.pdf",
            "urlHojaInstalacion": "https://example.com/instalacion.pdf",
            "certificaciones": ["INVIMA", "FDA"],
        },
    }


@pytest.fixture
def supplier_certificate_payload() -> dict:
    return {
        "nombre": "Certificado BPA",
        "cuerpoCertificador": "Entidad Certificadora",
        "fechaCertificacion": "2025-01-01",
        "fechaVencimiento": "2026-01-01",
        "urlDocumento": "https://example.com/certificado.pdf",
    }
