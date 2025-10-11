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


def test_create_salesperson_endpoint_success(client):
    payload = {
        "full_name": "Carlos López",
        "email": "carlos.lopez@example.com",
        "hire_date": date(2024, 3, 1).isoformat(),
        "status": "active",
    }

    response = client.post("/vendedores/", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == payload["full_name"]
    assert data["email"] == payload["email"]
    assert data["status"] == payload["status"]


def test_create_salesperson_endpoint_rejects_duplicate_email(client):
    payload = {
        "full_name": "Diana Castro",
        "email": "diana.castro@example.com",
        "hire_date": date(2024, 5, 20).isoformat(),
        "status": "active",
    }

    first = client.post("/vendedores/", json=payload)
    assert first.status_code == 200

    second = client.post("/vendedores/", json=payload)
    assert second.status_code == 400
    assert second.json()["detail"] == "Email already registered"
