"""Functional tests for Informe Comercial API routes."""

from faker import Faker


def test_create_informe_endpoint_success(client, fake: Faker):
    """Test successful creation through the API endpoint."""
    payload = {
        "nombre": fake.catch_phrase(),
    }

    response = client.post("/informes-comerciales/", json=payload)

    assert response.status_code == 201
    data = response.json()

    assert "id" in data
    assert data["nombre"] == payload["nombre"]
    assert "fecha" in data
    assert "ventasTotales" in data
    assert "unidadesVendidas" in data
    assert isinstance(data["ventasTotales"], (int, float))
    assert isinstance(data["unidadesVendidas"], (int, float))


def test_create_informe_endpoint_validates_nombre(client):
    """Test that API validates nombre field correctly."""
    # Empty nombre
    response = client.post("/informes-comerciales/", json={"nombre": ""})
    assert response.status_code == 422

    # Missing nombre
    response = client.post("/informes-comerciales/", json={})
    assert response.status_code == 422

    # Nombre too short (less than 2 characters)
    response = client.post("/informes-comerciales/", json={"nombre": "X"})
    assert response.status_code == 422

    # Nombre too long (more than 255 characters)
    long_name = "X" * 256
    response = client.post("/informes-comerciales/", json={"nombre": long_name})
    assert response.status_code == 422


def test_list_informes_endpoint_returns_paginated_response(client, fake: Faker):
    """Test that list endpoint returns correct pagination structure."""
    # Create some informes
    for _ in range(3):
        payload = {"nombre": fake.catch_phrase()}
        client.post("/informes-comerciales/", json=payload)

    response = client.get("/informes-comerciales/", params={"page": 1, "limit": 2})

    assert response.status_code == 200
    data = response.json()

    # Verify pagination structure
    assert "data" in data
    assert "total" in data
    assert "page" in data
    assert "limit" in data
    assert "total_pages" in data

    assert data["page"] == 1
    assert data["limit"] == 2
    assert data["total"] >= 3
    assert len(data["data"]) == 2
    assert data["total_pages"] >= 2


def test_list_informes_endpoint_default_pagination(client):
    """Test that list endpoint uses default pagination when not specified."""
    response = client.get("/informes-comerciales/")

    assert response.status_code == 200
    data = response.json()

    # Default values should be page=1, limit=10
    assert data["page"] == 1
    assert data["limit"] == 10


def test_list_informes_endpoint_returns_correct_schema(client, fake: Faker):
    """Test that list endpoint returns items with correct schema."""
    # Create an informe
    payload = {"nombre": fake.catch_phrase()}
    create_response = client.post("/informes-comerciales/", json=payload)
    assert create_response.status_code == 201

    # List informes
    list_response = client.get(
        "/informes-comerciales/", params={"page": 1, "limit": 10}
    )
    assert list_response.status_code == 200

    data = list_response.json()
    assert len(data["data"]) > 0

    # Verify each item has correct structure
    for item in data["data"]:
        assert "id" in item
        assert "nombre" in item
        assert "fecha" in item
        assert "ventasTotales" in item
        assert "unidadesVendidas" in item


def test_list_informes_endpoint_handles_empty_result(client):
    """Test that list endpoint handles empty database correctly."""
    # Get current count
    initial_response = client.get(
        "/informes-comerciales/", params={"page": 1, "limit": 10}
    )
    initial_data = initial_response.json()
    initial_count = initial_data["total"]

    # Request a page that doesn't exist
    response = client.get("/informes-comerciales/", params={"page": 9999, "limit": 10})

    assert response.status_code == 200
    data = response.json()

    assert data["total"] == initial_count  # Total should still be correct
    assert data["page"] == 9999
    assert len(data["data"]) == 0  # But no data on this page


def test_list_informes_endpoint_validates_pagination_params(client):
    """Test that list endpoint validates pagination parameters."""
    # Page < 1
    response = client.get("/informes-comerciales/", params={"page": 0, "limit": 10})
    assert response.status_code == 400
    assert "page and limit must be greater than zero" in response.json()["detail"]

    # Limit < 1
    response = client.get("/informes-comerciales/", params={"page": 1, "limit": 0})
    assert response.status_code == 400
    assert "page and limit must be greater than zero" in response.json()["detail"]


def test_create_informe_response_has_camel_case_fields(client, fake: Faker):
    """Test that API response uses camelCase for field names."""
    payload = {"nombre": fake.catch_phrase()}

    response = client.post("/informes-comerciales/", json=payload)

    assert response.status_code == 201
    data = response.json()

    # Should use camelCase
    assert "ventasTotales" in data
    assert "unidadesVendidas" in data

    # Should NOT use snake_case in response
    assert "ventas_totales" not in data
    assert "unidades_vendidas" not in data
