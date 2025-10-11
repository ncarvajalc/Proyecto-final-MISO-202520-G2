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


def test_salesperson_registration_end_to_end_flow(client):
    payload = {
        "full_name": "María Fernández",
        "email": "maria.fernandez@example.com",
        "hire_date": date(2024, 4, 10).isoformat(),
        "status": "active",
    }

    create_response = client.post("/vendedores/", json=payload)
    assert create_response.status_code == 200
    created = create_response.json()
    salesperson_id = created["id"]

    list_response = client.get("/vendedores/?page=1&limit=5")
    assert list_response.status_code == 200
    body = list_response.json()
    assert body["total"] == 1
    assert any(item["id"] == salesperson_id for item in body["data"])

    detail_response = client.get(f"/vendedores/{salesperson_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["email"] == payload["email"]

    update_response = client.put(
        f"/vendedores/{salesperson_id}",
        json={"full_name": "María F. Fernández", "status": "inactive"},
    )
    assert update_response.status_code == 200
    updated_body = update_response.json()
    assert updated_body["full_name"] == "María F. Fernández"
    assert updated_body["status"] == "inactive"

    delete_response = client.delete(f"/vendedores/{salesperson_id}")
    assert delete_response.status_code == 200

    not_found_response = client.get(f"/vendedores/{salesperson_id}")
    assert not_found_response.status_code == 404
    assert not_found_response.json()["detail"] == "Salespeople not found"
