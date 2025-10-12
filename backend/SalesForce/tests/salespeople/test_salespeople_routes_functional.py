import os

import pytest
from backend.test_client import TestClient
from faker import Faker

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


def test_create_salesperson_endpoint_success(client, fake: Faker):
    payload = {
        "full_name": fake.name(),
        "email": fake.unique.email(),
        "hire_date": fake.date_between(start_date="-2y", end_date="today").isoformat(),
        "status": fake.random_element(("active", "inactive")),
    }

    response = client.post("/vendedores/", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == payload["full_name"]
    assert data["email"] == payload["email"]
    assert data["status"] == payload["status"]


def test_create_salesperson_endpoint_rejects_duplicate_email(client, fake: Faker):
    payload = {
        "full_name": fake.name(),
        "email": fake.unique.email(),
        "hire_date": fake.date_between(start_date="-2y", end_date="today").isoformat(),
        "status": fake.random_element(("active", "inactive")),
    }

    first = client.post("/vendedores/", json=payload)
    assert first.status_code == 200

    second = client.post("/vendedores/", json=payload)
    assert second.status_code == 400
    assert second.json()["detail"] == "Email already registered"
