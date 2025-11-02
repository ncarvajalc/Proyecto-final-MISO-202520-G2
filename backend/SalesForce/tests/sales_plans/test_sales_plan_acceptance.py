import pytest
from faker import Faker

from app.modules.salespeople.models.salespeople_model import SalesPlan


def test_sales_plan_creation_end_to_end(client, db_session, fake: Faker):
    vendor_payload = {
        "full_name": fake.name(),
        "email": fake.unique.email(),
        "hire_date": fake.date_between(start_date="-2y", end_date="today").isoformat(),
        "status": fake.random_element(("active", "inactive")),
    }
    vendor_response = client.post("/vendedores/", json=vendor_payload)
    assert vendor_response.status_code == 200
    vendor_id = vendor_response.json()["id"]

    plan_payload = {
        "identificador": fake.unique.bothify(text="PV-####-Q#"),
        "nombre": fake.catch_phrase(),
        "descripcion": fake.text(max_nb_chars=60),
        "periodo": f"{fake.random_int(min=2020, max=2030)}-Q{fake.random_int(min=1, max=4)}",
        "meta": float(
            round(fake.pyfloat(min_value=50, max_value=500, right_digits=2), 2)
        ),
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

    stored_plan = db_session.query(SalesPlan).filter_by(id=plan_id).first()
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
    assert paginated["total_pages"] == 1
    assert paginated["page"] == 1
    assert paginated["limit"] == 10
    assert len(paginated["data"]) == 1
    assert paginated["data"][0]["id"] == plan_id
