import os
from datetime import date

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("TESTING", "1")

from app.core.database import Base, engine
from app.main import app


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)


def create_salesperson(client):
    payload = {
        "full_name": "Laura Ramírez",
        "email": "laura.ramirez@example.com",
        "hire_date": date(2024, 1, 1).isoformat(),
        "status": "active",
    }
    response = client.post("/vendedores/", json=payload)
    assert response.status_code == 200
    return response.json()


def test_create_sales_plan_endpoint_success(client):
    salesperson = create_salesperson(client)

    payload = {
        "identificador": "PV-2025-Q1",
        "nombre": "Plan Q1",
        "descripcion": "Plan para Q1",
        "periodo": "2025-Q1",
        "meta": 200.0,
        "vendedorId": salesperson["id"],
    }

    response = client.post("/planes-venta/", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["identificador"] == payload["identificador"]
    assert data["vendedorId"] == payload["vendedorId"]
    assert data["unidadesVendidas"] == 0.0


def test_create_sales_plan_endpoint_requires_existing_salesperson(client):
    payload = {
        "identificador": "PV-2025-Q2",
        "nombre": "Plan Q2",
        "descripcion": "Plan para Q2",
        "periodo": "2025-Q2",
        "meta": 210.0,
        "vendedorId": "missing",
    }

    response = client.post("/planes-venta/", json=payload)

    assert response.status_code == 404
    assert response.json()["detail"] == "Salesperson not found"


def test_list_sales_plan_endpoint_returns_paginated_payload(client):
    salesperson = create_salesperson(client)

    for idx in range(3):
        payload = {
            "identificador": f"PV-2025-Q{idx + 1}",
            "nombre": f"Plan Q{idx + 1}",
            "descripcion": f"Plan para Q{idx + 1}",
            "periodo": f"2025-Q{idx + 1}",
            "meta": 200.0 + idx,
            "vendedorId": salesperson["id"],
        }
        create_response = client.post("/planes-venta/", json=payload)
        assert create_response.status_code == 200

    response = client.get("/planes-venta/", params={"page": 1, "limit": 2})
    assert response.status_code == 200

    payload = response.json()
    assert payload["total"] == 3
    assert payload["page"] == 1
    assert payload["limit"] == 2
    assert payload["totalPages"] == 2
    assert len(payload["data"]) == 2
    assert all(item["vendedorNombre"] == salesperson["full_name"] for item in payload["data"])


def test_list_sales_plan_endpoint_validates_query_params(client):
    response = client.get("/planes-venta/", params={"page": 0, "limit": 10})

    assert response.status_code == 400
    assert response.json()["detail"] == "page and limit must be greater than zero"
