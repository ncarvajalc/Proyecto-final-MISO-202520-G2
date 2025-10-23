"""Functional tests for vehicle routes."""

from __future__ import annotations

import math

from faker import Faker


def test_create_vehicle_endpoint_success(client, fake: Faker):
    """Test POST /vehiculos creates a vehicle successfully."""
    payload = {
        "placa": fake.unique.bothify(text="???-###"),
        "conductor": fake.name(),
        "numero_entregas": fake.random_int(min=0, max=20),
    }

    response = client.post("/vehiculos", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["placa"] == payload["placa"]
    assert data["conductor"] == payload["conductor"]
    assert data["numeroEntregas"] == payload["numero_entregas"]
    assert "id" in data
    assert data["id"] is not None
    assert "created_at" in data
    assert "updated_at" in data


def test_create_vehicle_endpoint_rejects_duplicate_placa(client, fake: Faker):
    """Test POST /vehiculos rejects duplicate license plates."""
    placa = fake.unique.bothify(text="???-###")
    payload = {
        "placa": placa,
        "conductor": fake.name(),
        "numero_entregas": fake.random_int(min=0, max=20),
    }

    # Create first vehicle
    response = client.post("/vehiculos", json=payload)
    assert response.status_code == 201

    # Try to create duplicate
    response = client.post("/vehiculos", json=payload)
    assert response.status_code == 409
    assert f"Vehicle with placa '{placa}' already exists" in response.json()["detail"]


def test_create_vehicle_endpoint_validates_required_fields(client):
    """Test POST /vehiculos validates required fields."""
    # Missing placa
    payload = {
        "conductor": "Test Driver",
        "numero_entregas": 0,
    }
    response = client.post("/vehiculos", json=payload)
    assert response.status_code == 422  # Unprocessable Entity

    # Missing conductor
    payload = {
        "placa": "ABC-123",
        "numero_entregas": 0,
    }
    response = client.post("/vehiculos", json=payload)
    assert response.status_code == 422


def test_create_vehicle_endpoint_validates_numero_entregas(client, fake: Faker):
    """Test POST /vehiculos validates numero_entregas is non-negative."""
    payload = {
        "placa": fake.unique.bothify(text="???-###"),
        "conductor": fake.name(),
        "numero_entregas": -1,  # Invalid: negative
    }

    response = client.post("/vehiculos", json=payload)
    assert response.status_code == 422


def test_list_vehicles_endpoint_returns_paginated_payload(client, fake: Faker):
    """Test GET /vehiculos returns paginated list."""
    # Get baseline
    baseline = client.get("/vehiculos", params={"page": 1, "limit": 1}).json()["total"]

    # Create 3 vehicles
    for _ in range(3):
        payload = {
            "placa": fake.unique.bothify(text="???-###"),
            "conductor": fake.name(),
            "numero_entregas": fake.random_int(min=0, max=20),
        }
        create_response = client.post("/vehiculos", json=payload)
        assert create_response.status_code == 201

    # Test pagination
    response = client.get("/vehiculos", params={"page": 1, "limit": 2})
    assert response.status_code == 200

    payload = response.json()
    expected_total = baseline + 3
    expected_pages = math.ceil(expected_total / 2)

    assert payload["total"] == expected_total
    assert payload["page"] == 1
    assert payload["limit"] == 2
    assert payload["total_pages"] == expected_pages
    assert len(payload["data"]) == min(2, expected_total)

    # Verify data structure
    for vehicle in payload["data"]:
        assert "id" in vehicle
        assert "placa" in vehicle
        assert "conductor" in vehicle
        assert "numeroEntregas" in vehicle
        assert "created_at" in vehicle
        assert "updated_at" in vehicle


def test_list_vehicles_endpoint_validates_query_params(client):
    """Test GET /vehiculos validates query parameters."""
    # Invalid page (0)
    response = client.get("/vehiculos", params={"page": 0, "limit": 10})
    assert response.status_code == 400
    assert response.json()["detail"] == "page and limit must be greater than zero"

    # Invalid limit (0)
    response = client.get("/vehiculos", params={"page": 1, "limit": 0})
    assert response.status_code == 400

    # Negative page
    response = client.get("/vehiculos", params={"page": -1, "limit": 10})
    assert response.status_code == 400


def test_list_vehicles_endpoint_uses_default_pagination(client):
    """Test GET /vehiculos uses default pagination when params not provided."""
    response = client.get("/vehiculos")
    assert response.status_code == 200

    payload = response.json()
    assert payload["page"] == 1
    assert payload["limit"] == 10
    assert "total" in payload
    assert "total_pages" in payload
    assert "data" in payload


def test_list_vehicles_endpoint_handles_empty_results(client):
    """Test GET /vehiculos handles empty database correctly."""
    response = client.get("/vehiculos", params={"page": 1, "limit": 10})
    assert response.status_code == 200

    payload = response.json()
    assert payload["total"] == 0
    assert payload["total_pages"] == 0
    assert len(payload["data"]) == 0


def test_list_vehicles_endpoint_returns_correct_page(client, fake: Faker):
    """Test GET /vehiculos returns correct page of results."""
    # Create 5 vehicles
    created_vehicles = []
    for _ in range(5):
        payload = {
            "placa": fake.unique.bothify(text="???-###"),
            "conductor": fake.name(),
            "numero_entregas": fake.random_int(min=0, max=20),
        }
        response = client.post("/vehiculos", json=payload)
        created_vehicles.append(response.json())

    # Get first page (2 items)
    response = client.get("/vehiculos", params={"page": 1, "limit": 2})
    first_page = response.json()
    assert len(first_page["data"]) == 2

    # Get second page (2 items)
    response = client.get("/vehiculos", params={"page": 2, "limit": 2})
    second_page = response.json()
    assert len(second_page["data"]) == 2

    # Get third page (1 item)
    response = client.get("/vehiculos", params={"page": 3, "limit": 2})
    third_page = response.json()
    assert len(third_page["data"]) == 1

    # Verify no overlap between pages
    first_page_ids = {v["id"] for v in first_page["data"]}
    second_page_ids = {v["id"] for v in second_page["data"]}
    assert first_page_ids.isdisjoint(second_page_ids)


__all__ = []
