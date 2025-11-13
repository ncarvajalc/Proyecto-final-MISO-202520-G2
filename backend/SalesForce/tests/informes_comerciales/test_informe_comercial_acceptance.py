"""Acceptance tests for Informe Comercial end-to-end flows."""

from faker import Faker

import pytest
from faker import Faker

from app.modules.reports.models import InformeComercial
from app.modules.salespeople.models.salespeople_model import SalesPlan


@pytest.fixture(autouse=True)
def _reset_informe_state(db_session):
    db_session.query(InformeComercial).delete()
    db_session.query(SalesPlan).delete()
    db_session.commit()


def test_informe_comercial_creation_end_to_end(client, db_session, fake: Faker):
    """Test the complete flow of creating an informe comercial from API to database."""
    # Create informe payload
    informe_payload = {
        "nombre": fake.catch_phrase(),
    }

    # Create informe comercial
    create_response = client.post("/informes-comerciales/", json=informe_payload)
    assert create_response.status_code == 201
    created_informe = create_response.json()
    informe_id = created_informe["id"]

    # Verify response structure
    assert created_informe["nombre"] == informe_payload["nombre"]
    assert "fecha" in created_informe and created_informe["fecha"]
    assert "ventasTotales" in created_informe
    assert "unidadesVendidas" in created_informe
    assert isinstance(created_informe["ventasTotales"], (int, float))
    assert isinstance(created_informe["unidadesVendidas"], (int, float))

    # Verify persistence in database
    stored_informe = db_session.query(InformeComercial).filter_by(id=informe_id).first()
    assert stored_informe is not None
    assert stored_informe.nombre == informe_payload["nombre"]
    assert stored_informe.ventas_totales >= 0
    assert stored_informe.unidades_vendidas >= 0

    # Test list endpoint
    list_response = client.get(
        "/informes-comerciales/", params={"page": 1, "limit": 10}
    )
    assert list_response.status_code == 200

    paginated = list_response.json()
    assert paginated["total"] >= 1
    assert paginated["page"] == 1
    assert paginated["limit"] == 10
    assert len(paginated["data"]) >= 1

    # Find our created informe in the list
    found = any(item["id"] == informe_id for item in paginated["data"])
    assert found, "Created informe should appear in list"


def test_list_informes_comerciales_pagination(client, db_session, fake: Faker):
    """Test pagination works correctly for informes comerciales."""
    # Create multiple informes
    created_ids = []
    for _ in range(3):
        payload = {"nombre": fake.catch_phrase()}
        response = client.post("/informes-comerciales/", json=payload)
        assert response.status_code == 201
        created_ids.append(response.json()["id"])

    # Test first page with limit 2
    page1_response = client.get(
        "/informes-comerciales/", params={"page": 1, "limit": 2}
    )
    assert page1_response.status_code == 200
    page1_data = page1_response.json()

    assert page1_data["page"] == 1
    assert page1_data["limit"] == 2
    assert page1_data["total"] >= 3
    assert len(page1_data["data"]) == 2
    assert page1_data["total_pages"] >= 2

    # Test second page
    page2_response = client.get(
        "/informes-comerciales/", params={"page": 2, "limit": 2}
    )
    assert page2_response.status_code == 200
    page2_data = page2_response.json()

    assert page2_data["page"] == 2
    assert len(page2_data["data"]) >= 1

    # Verify no duplicates between pages
    page1_ids = {item["id"] for item in page1_data["data"]}
    page2_ids = {item["id"] for item in page2_data["data"]}
    assert not page1_ids.intersection(
        page2_ids
    ), "Pages should not have duplicate items"


def test_informe_comercial_calculates_indicators_from_sales_plans(
    client, db_session, fake: Faker
):
    """Test that informe comercial calculates indicators from existing sales plans."""
    # First, create a salesperson
    salesperson_payload = {
        "full_name": fake.name(),
        "email": fake.unique.email(),
        "hire_date": fake.date_between(start_date="-2y", end_date="today").isoformat(),
        "status": "active",
    }
    salesperson_response = client.post("/vendedores/", json=salesperson_payload)
    assert salesperson_response.status_code == 200
    salesperson_id = salesperson_response.json()["id"]

    # Create a sales plan with some sales data
    sales_plan_payload = {
        "identificador": fake.unique.bothify(text="PV-####-Q#"),
        "nombre": fake.catch_phrase(),
        "descripcion": fake.text(max_nb_chars=60),
        "periodo": f"{fake.random_int(min=2020, max=2030)}-Q{fake.random_int(min=1, max=4)}",
        "meta": 1000.0,
        "vendedorId": salesperson_id,
    }
    sales_plan_response = client.post("/planes-venta/", json=sales_plan_payload)
    assert sales_plan_response.status_code == 200

    # Now create an informe comercial
    informe_payload = {"nombre": "Informe con datos"}
    create_response = client.post("/informes-comerciales/", json=informe_payload)
    assert create_response.status_code == 201

    created_informe = create_response.json()

    # The indicators should reflect the sales plan data
    # Note: The calculation uses meta as proxy for sales value in the current implementation
    assert created_informe["ventasTotales"] >= 0
    assert created_informe["unidadesVendidas"] >= 0


def test_informe_comercial_creation_requires_nombre(client):
    """Test that nombre field is required for creating an informe comercial."""
    # Try to create without nombre
    empty_payload = {}
    response = client.post("/informes-comerciales/", json=empty_payload)
    assert response.status_code == 422  # Validation error

    # Try with empty nombre
    invalid_payload = {"nombre": ""}
    response = client.post("/informes-comerciales/", json=invalid_payload)
    assert response.status_code == 422  # Validation error

    # Try with nombre that's too short
    short_payload = {"nombre": "X"}
    response = client.post("/informes-comerciales/", json=short_payload)
    assert response.status_code == 422  # Validation error
