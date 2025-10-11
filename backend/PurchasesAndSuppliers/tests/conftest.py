import os
from pathlib import Path
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

os.environ.setdefault("TESTING", "1")

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from tests.suppliers_test_app import Supplier, router  # noqa: E402


def _include_router_once() -> None:
    if not any(
        route.path == "/api/proveedores" and "POST" in route.methods
        for route in app.router.routes
    ):
        app.include_router(router)


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
def supplier_certificate_payload() -> dict:
    return {
        "nombre": "Certificado BPA",
        "cuerpoCertificador": "Entidad Certificadora",
        "fechaCertificacion": "2025-01-01",
        "fechaVencimiento": "2026-01-01",
        "urlDocumento": "https://example.com/certificado.pdf",
    }
