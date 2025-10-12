from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

# ----------------------------
# Configuración de base de datos de prueba (SQLite local)
# ----------------------------
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine_test = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine_test)

# ----------------------------
# Inicialización del cache en memoria
# ----------------------------
FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")

# ----------------------------
# Cliente de pruebas
# ----------------------------
client = TestClient(app)

# ----------------------------
# Tests
# ----------------------------

def test_crear_proveedor():
    proveedor_data = {
        "nombre": "Proveedor Test",
        "id_tax": "123456789",
        "direccion": "Calle 123",
        "telefono": "987654321",
        "correo": "proveedor@test.com",
        "contacto": "Juan",
        "estado": "activo",
        "certificado": {
            "nombre": "Certificación",
            "cuerpoCertificador": "Esto es el cuerpo",
            "fechaCertificacion": "2025-10-07",
            "fechaVencimiento": "2025-10-18",
            "urlDocumento": "https://google.com"
        }
    }

    response = client.post("/proveedores/", json=proveedor_data)
    assert response.status_code == 200, f"Error: {response.text}"

    data = response.json()
    assert data["nombre"] == proveedor_data["nombre"]
    assert data["id_tax"] == proveedor_data["id_tax"]
    assert data["correo"] == proveedor_data["correo"]
    assert "certificado" in data
    assert data["certificado"]["nombre"] == "Certificación"


def test_listar_proveedores():
    response = client.get("/proveedores/?page=1&limit=10")
    assert response.status_code == 200, f"Error: {response.text}"

    data = response.json()
    assert "data" in data
    assert "total" in data
    assert "page" in data
    assert "limit" in data
    assert "totalPages" in data

    assert isinstance(data["data"], list)
    assert len(data["data"]) >= 1
