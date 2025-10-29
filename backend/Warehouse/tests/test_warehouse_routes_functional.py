"""Functional tests for warehouse routes."""

from __future__ import annotations

from faker import Faker


def test_create_warehouse_endpoint_success(client, fake: Faker):
    """Test POST /bodegas creates a warehouse successfully."""
    payload = {
        "nombre": f"{fake.city()}-1",
        "ubicacion": fake.city(),
    }

    response = client.post("/bodegas/", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["nombre"] == payload["nombre"]
    assert data["ubicacion"] == payload["ubicacion"]
    assert "id" in data
    assert data["id"] is not None
    assert "created_at" in data
    assert "updated_at" in data


def test_create_warehouse_endpoint_validates_required_fields(client):
    """Test POST /bodegas validates required fields."""
    # Missing nombre
    payload = {"ubicacion": "Bogotá"}
    response = client.post("/bodegas/", json=payload)
    assert response.status_code == 422  # Unprocessable Entity

    # Missing ubicacion (optional, should still work)
    payload = {"nombre": "Test-1"}
    response = client.post("/bodegas/", json=payload)
    assert response.status_code == 201


def test_list_warehouses_endpoint_returns_simple_list(client, fake: Faker):
    """Test GET /bodegas returns simple list by default."""
    # Create a warehouse
    payload = {
        "nombre": f"{fake.city()}-Test",
        "ubicacion": fake.city(),
    }
    create_response = client.post("/bodegas/", json=payload)
    assert create_response.status_code == 201

    # Get simple list
    response = client.get("/bodegas/")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

    # Check structure of items
    for warehouse in data:
        assert "id" in warehouse
        assert "nombre" in warehouse
        assert "ubicacion" in warehouse


def test_list_warehouses_endpoint_returns_paginated_payload(client, fake: Faker):
    """Test GET /bodegas?simple=false returns paginated list."""
    # Get baseline - use simple=True to get the count
    baseline = len(client.get("/bodegas/").json())

    # Create 3 warehouses
    for i in range(3):
        payload = {
            "nombre": f"{fake.city()}-{i}",
            "ubicacion": fake.city(),
        }
        create_response = client.post("/bodegas/", json=payload)
        assert create_response.status_code == 201

    # Test simple list returns all items
    response = client.get("/bodegas/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == baseline + 3


def test_get_warehouse_by_id_success(client, fake: Faker):
    """Test GET /bodegas/{warehouse_id} returns warehouse details."""
    # Create a warehouse
    payload = {
        "nombre": f"{fake.city()}-Detail",
        "ubicacion": fake.city(),
    }
    create_response = client.post("/bodegas/", json=payload)
    assert create_response.status_code == 201
    warehouse_id = create_response.json()["id"]

    # Get warehouse by ID
    response = client.get(f"/bodegas/{warehouse_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == warehouse_id
    assert data["nombre"] == payload["nombre"]
    assert data["ubicacion"] == payload["ubicacion"]


def test_get_warehouse_by_id_not_found(client, fake: Faker):
    """Test GET /bodegas/{warehouse_id} returns 404 for non-existent warehouse."""
    non_existent_id = fake.uuid4()
    response = client.get(f"/bodegas/{non_existent_id}")

    assert response.status_code == 404


def test_update_warehouse_endpoint_success(client, fake: Faker):
    """Test PUT /bodegas/{warehouse_id} updates warehouse successfully."""
    # Create a warehouse
    payload = {
        "nombre": "Original-Name",
        "ubicacion": "Original Location",
    }
    create_response = client.post("/bodegas/", json=payload)
    assert create_response.status_code == 201
    warehouse_id = create_response.json()["id"]

    # Update warehouse
    update_payload = {
        "nombre": "Updated-Name",
        "ubicacion": "Updated Location",
    }
    response = client.put(f"/bodegas/{warehouse_id}", json=update_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == update_payload["nombre"]
    assert data["ubicacion"] == update_payload["ubicacion"]


def test_update_warehouse_partial_update(client, fake: Faker):
    """Test PUT /bodegas/{warehouse_id} allows partial updates."""
    # Create a warehouse
    payload = {
        "nombre": "Original",
        "ubicacion": "OriginalLoc",
    }
    create_response = client.post("/bodegas/", json=payload)
    warehouse_id = create_response.json()["id"]

    # Partial update (only nombre)
    update_payload = {"nombre": "PartialUpdate"}
    response = client.put(f"/bodegas/{warehouse_id}", json=update_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "PartialUpdate"
    assert data["ubicacion"] == "OriginalLoc"  # Should remain unchanged


def test_delete_warehouse_endpoint_success(client, fake: Faker):
    """Test DELETE /bodegas/{warehouse_id} deletes warehouse successfully."""
    # Create a warehouse
    payload = {
        "nombre": "ToDelete",
        "ubicacion": "DeleteLocation",
    }
    create_response = client.post("/bodegas/", json=payload)
    warehouse_id = create_response.json()["id"]

    # Delete warehouse
    response = client.delete(f"/bodegas/{warehouse_id}")
    assert response.status_code == 200

    # Verify it's deleted
    get_response = client.get(f"/bodegas/{warehouse_id}")
    assert get_response.status_code == 404


def test_delete_warehouse_not_found(client, fake: Faker):
    """Test DELETE /bodegas/{warehouse_id} returns 404 for non-existent warehouse."""
    non_existent_id = fake.uuid4()
    response = client.delete(f"/bodegas/{non_existent_id}")

    assert response.status_code == 404


__all__ = []
