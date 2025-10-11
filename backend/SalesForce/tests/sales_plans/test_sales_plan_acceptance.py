import os
from datetime import date

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("TESTING", "1")

from app.core.database import Base, SessionLocal, engine
from app.modules.salespeople.models.salespeople_model import SalesPlan
from app.main import app


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)


def test_sales_plan_creation_end_to_end(client):
    vendor_payload = {
        "full_name": "Andrea Salas",
        "email": "andrea.salas@example.com",
        "hire_date": date(2024, 1, 15).isoformat(),
        "status": "active",
    }
    vendor_response = client.post("/vendedores/", json=vendor_payload)
    assert vendor_response.status_code == 200
    vendor_id = vendor_response.json()["id"]

    plan_payload = {
        "identificador": "PV-2025-Q1",
        "nombre": "Plan Trimestral",
        "descripcion": "Plan estratégico del Q1",
        "periodo": "2025-Q1",
        "meta": 180.0,
        "vendedorId": vendor_id,
    }

    create_response = client.post("/planes-venta/", json=plan_payload)
    assert create_response.status_code == 200
    created_plan = create_response.json()
    plan_id = created_plan["id"]

    assert created_plan["identificador"] == plan_payload["identificador"]
    assert created_plan["nombre"] == plan_payload["nombre"]
    assert created_plan["descripcion"] == plan_payload["descripcion"]
    assert created_plan["periodo"] == plan_payload["periodo"]
    assert created_plan["meta"] == plan_payload["meta"]
    assert created_plan["vendedorId"] == vendor_id
    assert created_plan["unidadesVendidas"] == 0
    assert created_plan["vendedorNombre"] == vendor_payload["full_name"]
    assert "createdAt" in created_plan and created_plan["createdAt"]
    assert "updatedAt" in created_plan and created_plan["updatedAt"]

    with SessionLocal() as session:
        stored_plan = session.query(SalesPlan).filter_by(id=plan_id).first()
        assert stored_plan is not None
        assert stored_plan.identificador == plan_payload["identificador"]
        assert stored_plan.vendedor_id == vendor_id

    duplicate_response = client.post("/planes-venta/", json=plan_payload)
    assert duplicate_response.status_code == 400
    assert duplicate_response.json()["detail"] == "Identificador already exists"

    list_response = client.get("/planes-venta/", params={"page": 1, "limit": 10})
    assert list_response.status_code == 200

    paginated = list_response.json()
    assert paginated["total"] == 1
    assert paginated["totalPages"] == 1
    assert paginated["page"] == 1
    assert paginated["limit"] == 10
    assert len(paginated["data"]) == 1
    assert paginated["data"][0]["id"] == plan_id
