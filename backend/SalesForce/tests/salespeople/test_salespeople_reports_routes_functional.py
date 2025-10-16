"""Functional tests for the vendor report endpoint."""

"""Functional tests for the vendor report endpoint."""

from faker import Faker


def _create_salesperson(client, fake: Faker) -> dict:
    payload = {
        "full_name": fake.name(),
        "email": fake.unique.email(),
        "hire_date": fake.date_between(start_date="-2y", end_date="today").isoformat(),
        "status": "active",
    }
    response = client.post("/vendedores/", json=payload)
    assert response.status_code == 200
    return response.json()


def _create_sales_plan(client, fake: Faker, vendedor_id: str) -> dict:
    payload = {
        "identificador": fake.unique.bothify(text="PV-####-Q#"),
        "nombre": fake.catch_phrase(),
        "descripcion": fake.text(max_nb_chars=50),
        "periodo": f"{fake.random_int(min=2023, max=2026)}-Q{fake.random_int(min=1, max=4)}",
        "meta": float(fake.random_int(min=1000, max=5000)),
        "vendedorId": vendedor_id,
    }
    response = client.post("/planes-venta/", json=payload)
    assert response.status_code == 200
    return payload


def test_vendor_report_returns_sales_plan_details(client, fake: Faker):
    salesperson = _create_salesperson(client, fake)
    plan_payload = _create_sales_plan(client, fake, salesperson["id"])

    report_response = client.get(f"/vendedores/{salesperson['id']}")
    assert report_response.status_code == 200

    report = report_response.json()
    assert report["id"] == salesperson["id"]
    assert report["email"] == salesperson["email"]
    assert len(report["sales_plans"]) == 1

    plan_data = report["sales_plans"][0]
    assert plan_data["identificador"] == plan_payload["identificador"]
    assert plan_data["nombre"] == plan_payload["nombre"]
    assert plan_data["descripcion"] == plan_payload["descripcion"]
    assert plan_data["periodo"] == plan_payload["periodo"]
    assert plan_data["meta"] == plan_payload["meta"]
    assert plan_data["unidadesVendidas"] == 0


def test_vendor_report_for_salesperson_without_plan_returns_empty_list(client, fake: Faker):
    salesperson = _create_salesperson(client, fake)

    report_response = client.get(f"/vendedores/{salesperson['id']}")
    assert report_response.status_code == 200

    report = report_response.json()
    assert report["sales_plans"] == []
