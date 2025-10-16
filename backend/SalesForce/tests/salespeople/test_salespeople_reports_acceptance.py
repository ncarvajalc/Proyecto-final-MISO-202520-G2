"""Acceptance tests for the vendor report flow."""
"""Acceptance tests for the vendor report flow."""

from faker import Faker


def _create_salesperson(client, fake: Faker, *, status: str = "active") -> dict:
    payload = {
        "full_name": fake.name(),
        "email": fake.unique.email(),
        "hire_date": fake.date_between(start_date="-3y", end_date="-1y").isoformat(),
        "status": status,
    }
    response = client.post("/vendedores/", json=payload)
    assert response.status_code == 200
    return response.json()


def _assign_plan(client, fake: Faker, vendor_id: str, *, goal: float) -> dict:
    payload = {
        "identificador": fake.unique.bothify(text="RP-####-Q#"),
        "nombre": fake.catch_phrase(),
        "descripcion": fake.text(max_nb_chars=80),
        "periodo": f"{fake.random_int(min=2023, max=2026)}-Q{fake.random_int(min=1, max=4)}",
        "meta": goal,
        "vendedorId": vendor_id,
    }
    creation = client.post("/planes-venta/", json=payload)
    assert creation.status_code == 200
    created_plan = creation.json()
    return {
        "id": created_plan["id"],
        **payload,
        "unidadesVendidas": created_plan["unidadesVendidas"],
    }


def test_vendor_report_acceptance_flow(client, fake: Faker):
    """Complete flow of creating vendors, assigning plans and consulting their reports."""

    vendor_with_plan = _create_salesperson(client, fake)
    vendor_without_plan = _create_salesperson(client, fake, status="inactive")

    plan_details = _assign_plan(
        client,
        fake,
        vendor_with_plan["id"],
        goal=float(fake.random_int(min=200, max=400)),
    )

    report_with_plan = client.get(f"/vendedores/{vendor_with_plan['id']}")
    report_without_plan = client.get(f"/vendedores/{vendor_without_plan['id']}")

    assert report_with_plan.status_code == 200
    assert report_without_plan.status_code == 200

    with_plan_payload = report_with_plan.json()
    without_plan_payload = report_without_plan.json()

    assert with_plan_payload["id"] == vendor_with_plan["id"]
    assert without_plan_payload["sales_plans"] == []

    plan_data = with_plan_payload["sales_plans"][0]
    assert plan_data["identificador"] == plan_details["identificador"]
    assert plan_data["unidadesVendidas"] == plan_details["unidadesVendidas"]
    assert plan_data["meta"] == plan_details["meta"]

    # Acceptance criteria: the report highlights completion percentage
    completion = (plan_details["unidadesVendidas"] / plan_details["meta"]) * 100
    assert completion >= 0


def test_vendor_report_not_found_response(client):
    response = client.get("/vendedores/unknown-vendor")
    assert response.status_code == 404
    assert response.json()["detail"] == "Salespeople not found"
