"""Functional tests for sales plan routes."""

import math

from faker import Faker


def create_salesperson(client, fake: Faker) -> dict:
    payload = {
        "full_name": fake.name(),
        "email": fake.unique.email(),
        "hire_date": fake.date_between(start_date="-2y", end_date="today").isoformat(),
        "status": fake.random_element(("active", "inactive")),
    }
    response = client.post("/vendedores/", json=payload)
    assert response.status_code == 200
    return response.json()


def test_create_sales_plan_endpoint_success(client, fake: Faker):
    salesperson = create_salesperson(client, fake)

    payload = {
        "identificador": fake.unique.bothify(text="PV-####-Q#"),
        "nombre": fake.catch_phrase(),
        "descripcion": fake.text(max_nb_chars=60),
        "periodo": f"{fake.random_int(min=2020, max=2030)}-Q{fake.random_int(min=1, max=4)}",
        "meta": float(round(fake.pyfloat(min_value=50, max_value=500, right_digits=2), 2)),
        "vendedorId": salesperson["id"],
    }

    response = client.post("/planes-venta/", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["identificador"] == payload["identificador"]
    assert data["vendedorId"] == payload["vendedorId"]
    assert data["unidadesVendidas"] == 0.0


def test_create_sales_plan_endpoint_requires_existing_salesperson(client, fake: Faker):
    payload = {
        "identificador": fake.unique.bothify(text="PV-####-Q#"),
        "nombre": fake.catch_phrase(),
        "descripcion": fake.text(max_nb_chars=60),
        "periodo": f"{fake.random_int(min=2020, max=2030)}-Q{fake.random_int(min=1, max=4)}",
        "meta": float(round(fake.pyfloat(min_value=50, max_value=500, right_digits=2), 2)),
        "vendedorId": fake.uuid4(),
    }

    response = client.post("/planes-venta/", json=payload)

    assert response.status_code == 404
    assert response.json()["detail"] == "Salesperson not found"


def test_list_sales_plan_endpoint_returns_paginated_payload(client, fake: Faker):
    salesperson = create_salesperson(client, fake)

    baseline = client.get("/planes-venta/", params={"page": 1, "limit": 1}).json()["total"]
    used_periods: set[str] = set()

    for _ in range(3):
        period = f"{fake.random_int(min=2020, max=2030)}-Q{fake.random_int(min=1, max=4)}"
        while period in used_periods:
            period = f"{fake.random_int(min=2020, max=2030)}-Q{fake.random_int(min=1, max=4)}"
        used_periods.add(period)

        payload = {
            "identificador": fake.unique.bothify(text="PV-####-Q#"),
            "nombre": fake.catch_phrase(),
            "descripcion": fake.text(max_nb_chars=60),
            "periodo": period,
            "meta": float(round(fake.pyfloat(min_value=50, max_value=500, right_digits=2), 2)),
            "vendedorId": salesperson["id"],
        }
        create_response = client.post("/planes-venta/", json=payload)
        assert create_response.status_code == 200

    response = client.get("/planes-venta/", params={"page": 1, "limit": 2})
    assert response.status_code == 200

    payload = response.json()
    expected_total = baseline + 3
    expected_pages = math.ceil(expected_total / 2)
    assert payload["total"] == expected_total
    assert payload["page"] == 1
    assert payload["limit"] == 2
    assert payload["total_pages"] == expected_pages
    assert len(payload["data"]) == min(2, expected_total)

    detail = client.get(f"/vendedores/{salesperson['id']}")
    assert detail.status_code == 200
    detail_payload = detail.json()
    assert detail_payload["id"] == salesperson["id"]
    assert len(detail_payload["sales_plans"]) >= 3


def test_list_sales_plan_endpoint_validates_query_params(client):
    response = client.get("/planes-venta/", params={"page": 0, "limit": 10})

    assert response.status_code == 400
    assert response.json()["detail"] == "page and limit must be greater than zero"
