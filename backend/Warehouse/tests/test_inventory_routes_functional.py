"""Functional tests for inventory routes."""

from __future__ import annotations

from datetime import date, timedelta

import pytest
from faker import Faker


def test_create_inventory_endpoint_success(client, fake: Faker):
    """Test POST /inventario creates inventory entry successfully."""
    # First create a warehouse
    warehouse_payload = {
        "nombre": f"{fake.city()}-Inv",
        "ubicacion": fake.city(),
    }
    warehouse_response = client.post("/bodegas/", json=warehouse_payload)
    warehouse_id = warehouse_response.json()["id"]

    # Create inventory
    payload = {
        "warehouse_id": warehouse_id,
        "product_id": "MED-TEST-001",
        "batch_number": "BATCH-001",
        "quantity": 100,
        "storage_type": "cold",
        "zona": "A1-3",
        "capacity": 200,
        "expiration_date": (date.today() + timedelta(days=365)).isoformat(),
    }

    response = client.post("/inventario/", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["warehouse_id"] == payload["warehouse_id"]
    assert data["product_id"] == payload["product_id"]
    assert data["batch_number"] == payload["batch_number"]
    assert data["quantity"] == payload["quantity"]
    assert data["storage_type"] == payload["storage_type"]
    assert data["zona"] == payload["zona"]
    assert "id" in data


def test_create_inventory_validates_required_fields(client, fake: Faker):
    """Test POST /inventario validates required fields."""
    # Create warehouse first
    warehouse_payload = {"nombre": "Test", "ubicacion": "Test"}
    warehouse_response = client.post("/bodegas/", json=warehouse_payload)
    warehouse_id = warehouse_response.json()["id"]

    # Missing product_id
    payload = {
        "warehouse_id": warehouse_id,
        "batch_number": "BATCH-001",
        "quantity": 100,
        "storage_type": "general",
    }
    response = client.post("/inventario/", json=payload)
    assert response.status_code == 422


def test_create_inventory_validates_quantity_non_negative(client, fake: Faker):
    """Test POST /inventario validates quantity is non-negative."""
    warehouse_payload = {"nombre": f"{fake.city()}-NegTest", "ubicacion": fake.city()}
    warehouse_response = client.post("/bodegas/", json=warehouse_payload)
    warehouse_id = warehouse_response.json()["id"]

    payload = {
        "warehouse_id": warehouse_id,
        "product_id": "MED-TEST",
        "batch_number": "BATCH-001",
        "quantity": -10,  # Invalid
        "storage_type": "general",
    }

    response = client.post("/inventario/", json=payload)
    assert response.status_code == 422


def test_list_inventory_endpoint_returns_paginated_payload(client, fake: Faker):
    """Test GET /inventario returns paginated list."""
    # Create warehouse
    warehouse_payload = {"nombre": "InvList", "ubicacion": "Test"}
    warehouse_response = client.post("/bodegas/", json=warehouse_payload)
    warehouse_id = warehouse_response.json()["id"]

    # Get baseline
    baseline = client.get("/inventario/?page=1&limit=1").json()["total"]

    # Create 3 inventory entries
    for i in range(3):
        payload = {
            "warehouse_id": warehouse_id,
            "product_id": f"MED-{i}",
            "batch_number": f"BATCH-{i}",
            "quantity": 50,
            "storage_type": "general",
            "zona": f"A{i}-1",
        }
        create_response = client.post("/inventario/", json=payload)
        assert create_response.status_code == 201

    # Test pagination
    response = client.get("/inventario/?page=1&limit=2")
    assert response.status_code == 200

    payload = response.json()
    assert payload["total"] == baseline + 3
    assert payload["page"] == 1
    assert payload["limit"] == 2
    assert len(payload["data"]) == 2


def test_get_inventory_by_warehouse(client, fake: Faker):
    """Test GET /inventario/bodega/{warehouse_id} returns inventory for specific warehouse."""
    # Create two warehouses
    wh1_response = client.post("/bodegas/", json={"nombre": "WH1", "ubicacion": "Loc1"})
    wh1_id = wh1_response.json()["id"]

    wh2_response = client.post("/bodegas/", json={"nombre": "WH2", "ubicacion": "Loc2"})
    wh2_id = wh2_response.json()["id"]

    # Create inventory in WH1
    payload1 = {
        "warehouse_id": wh1_id,
        "product_id": "MED-WH1",
        "batch_number": "BATCH-WH1",
        "quantity": 50,
        "storage_type": "general",
        "zona": "A1-1",
    }
    client.post("/inventario/", json=payload1)

    # Create inventory in WH2
    payload2 = {
        "warehouse_id": wh2_id,
        "product_id": "MED-WH2",
        "batch_number": "BATCH-WH2",
        "quantity": 75,
        "storage_type": "cold",
        "zona": "B2-3",
    }
    client.post("/inventario/", json=payload2)

    # Get inventory for WH1 only
    response = client.get(f"/inventario/bodega/{wh1_id}?page=1&limit=10")
    assert response.status_code == 200

    data = response.json()
    # Should only contain inventory from WH1
    for item in data["data"]:
        assert item["warehouse_id"] == wh1_id


# TODO: Fix inventory retrieval by product returning incorrect responses.
@pytest.mark.skip(
    reason="TODO: Fix inventory retrieval by product returning incorrect responses."
)
def test_get_inventory_by_product(client, fake: Faker):
    """Test GET /inventario/producto/{product_id} returns inventory across warehouses."""
    product_id = "MED-MULTI"

    # Create two warehouses
    wh1_response = client.post(
        "/bodegas/", json={"nombre": f"{fake.city()}-WH1", "ubicacion": "Loc1"}
    )
    wh1_id = wh1_response.json()["id"]

    wh2_response = client.post(
        "/bodegas/", json={"nombre": f"{fake.city()}-WH2", "ubicacion": "Loc2"}
    )
    wh2_id = wh2_response.json()["id"]

    # Create same product in both warehouses
    payload1 = {
        "warehouse_id": wh1_id,
        "product_id": product_id,
        "batch_number": "BATCH-1",
        "quantity": 50,
        "storage_type": "general",
        "zona": "A1-1",
    }
    client.post("/inventario/", json=payload1)

    payload2 = {
        "warehouse_id": wh2_id,
        "product_id": product_id,
        "batch_number": "BATCH-2",
        "quantity": 75,
        "storage_type": "general",
        "zona": "B2-2",
    }
    client.post("/inventario/", json=payload2)

    # Get inventory for product across all warehouses
    response = client.get(f"/inventario/producto/{product_id}")
    assert response.status_code == 200

    data = response.json()
    assert len(data) >= 2

    # All items should have the same product_id
    for item in data:
        assert item["product_id"] == product_id


def test_get_inventory_by_batch(client, fake: Faker):
    """Test GET /inventario/lote/{batch_number} returns inventory by batch number."""
    # Create warehouse
    warehouse_response = client.post(
        "/bodegas/", json={"nombre": "BatchTest", "ubicacion": "Test"}
    )
    warehouse_id = warehouse_response.json()["id"]

    batch_number = "BATCH-UNIQUE-001"

    # Create inventory with specific batch
    payload = {
        "warehouse_id": warehouse_id,
        "product_id": "MED-BATCH",
        "batch_number": batch_number,
        "quantity": 100,
        "storage_type": "general",
        "zona": "C3-4",
    }
    client.post("/inventario/", json=payload)

    # Get inventory by batch
    response = client.get(f"/inventario/lote/{batch_number}")
    assert response.status_code == 200

    data = response.json()
    assert len(data) >= 1

    # All items should have the same batch_number
    for item in data:
        assert item["batch_number"] == batch_number


def test_update_inventory_endpoint_success(client, fake: Faker):
    """Test PUT /inventario/{inventory_id} updates inventory successfully."""
    # Create warehouse and inventory
    warehouse_response = client.post(
        "/bodegas/", json={"nombre": "UpdateTest", "ubicacion": "Test"}
    )
    warehouse_id = warehouse_response.json()["id"]

    payload = {
        "warehouse_id": warehouse_id,
        "product_id": "MED-UPDATE",
        "batch_number": "BATCH-UPDATE",
        "quantity": 50,
        "storage_type": "general",
        "zona": "D1-5",
    }
    create_response = client.post("/inventario/", json=payload)
    inventory_id = create_response.json()["id"]

    # Update inventory
    update_payload = {
        "quantity": 150,
        "zona": "D2-6",
    }
    response = client.put(f"/inventario/{inventory_id}", json=update_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["quantity"] == 150
    assert data["zona"] == "D2-6"
    assert data["product_id"] == "MED-UPDATE"  # Unchanged


def test_delete_inventory_endpoint_success(client, fake: Faker):
    """Test DELETE /inventario/{inventory_id} deletes inventory successfully."""
    # Create warehouse and inventory
    warehouse_response = client.post(
        "/bodegas/", json={"nombre": "DeleteTest", "ubicacion": "Test"}
    )
    warehouse_id = warehouse_response.json()["id"]

    payload = {
        "warehouse_id": warehouse_id,
        "product_id": "MED-DELETE",
        "batch_number": "BATCH-DELETE",
        "quantity": 50,
        "storage_type": "general",
        "zona": "E1-1",
    }
    create_response = client.post("/inventario/", json=payload)
    inventory_id = create_response.json()["id"]

    # Delete inventory
    response = client.delete(f"/inventario/{inventory_id}")
    assert response.status_code == 200

    # Verify it's deleted
    get_response = client.get(f"/inventario/{inventory_id}")
    assert get_response.status_code == 404


def test_inventory_zona_field_present(client, fake: Faker):
    """Test that zona field is properly stored and retrieved."""
    warehouse_response = client.post(
        "/bodegas/", json={"nombre": "ZonaTest", "ubicacion": "Test"}
    )
    warehouse_id = warehouse_response.json()["id"]

    payload = {
        "warehouse_id": warehouse_id,
        "product_id": "MED-ZONA",
        "batch_number": "BATCH-ZONA",
        "quantity": 50,
        "storage_type": "cold",
        "zona": "F3-7",  # Physical location
    }
    create_response = client.post("/inventario/", json=payload)

    assert create_response.status_code == 201
    data = create_response.json()
    assert data["zona"] == "F3-7"
    assert data["storage_type"] == "cold"


__all__ = []
