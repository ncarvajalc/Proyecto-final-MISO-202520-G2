"""Functional tests for route endpoints."""

from __future__ import annotations

import math
from datetime import date
from decimal import Decimal

from faker import Faker


def test_create_route_endpoint_success(client, fake: Faker):
    """Test POST /rutas creates a route successfully."""
    # First create a vehicle
    vehicle_payload = {
        "placa": fake.unique.bothify(text="???-###"),
        "conductor": fake.name(),
        "numero_entregas": 0,
    }
    vehicle_response = client.post("/vehiculos", json=vehicle_payload)
    vehicle_id = vehicle_response.json()["id"]

    # Create route
    route_payload = {
        "vehicle_id": vehicle_id,
        "date": date.today().isoformat(),
        "total_distance_km": 25.5,
        "estimated_time_h": 1.5,
        "priority_level": "high",
        "status": "pending",
    }

    response = client.post("/rutas", json=route_payload)

    assert response.status_code == 201
    data = response.json()
    assert data["vehicleId"] == vehicle_id
    assert data["totalDistanceKm"] == 25.5
    assert data["estimatedTimeH"] == 1.5
    assert data["priorityLevel"] == "high"
    assert data["status"] == "pending"
    assert "id" in data
    assert "createdAt" in data
    assert "updatedAt" in data


def test_create_route_endpoint_validates_required_fields(client):
    """Test POST /rutas validates required fields."""
    # Missing vehicle_id
    payload = {
        "date": date.today().isoformat(),
        "priority_level": "normal",
        "status": "pending",
    }
    response = client.post("/rutas", json=payload)
    assert response.status_code == 422

    # Missing date
    payload = {
        "vehicle_id": "some-id",
        "priority_level": "normal",
        "status": "pending",
    }
    response = client.post("/rutas", json=payload)
    assert response.status_code == 422


def test_list_routes_endpoint_returns_paginated_payload(client, fake: Faker):
    """Test GET /rutas returns paginated list."""
    # Create a vehicle
    vehicle_payload = {
        "placa": fake.unique.bothify(text="???-###"),
        "conductor": fake.name(),
        "numero_entregas": 0,
    }
    vehicle_response = client.post("/vehiculos", json=vehicle_payload)
    vehicle_id = vehicle_response.json()["id"]

    # Create 3 routes
    for _ in range(3):
        route_payload = {
            "vehicle_id": vehicle_id,
            "date": date.today().isoformat(),
            "total_distance_km": 10.0,
            "estimated_time_h": 0.5,
            "priority_level": "normal",
            "status": "pending",
        }
        create_response = client.post("/rutas", json=route_payload)
        assert create_response.status_code == 201

    # Test pagination
    response = client.get("/rutas", params={"page": 1, "limit": 2})
    assert response.status_code == 200

    payload = response.json()
    assert payload["total"] == 3
    assert payload["page"] == 1
    assert payload["limit"] == 2
    assert payload["total_pages"] == 2
    assert len(payload["data"]) == 2

    # Verify data structure
    for route in payload["data"]:
        assert "id" in route
        assert "vehicleId" in route
        assert "date" in route
        assert "totalDistanceKm" in route
        assert "estimatedTimeH" in route
        assert "priorityLevel" in route
        assert "status" in route
        assert "createdAt" in route
        assert "updatedAt" in route


def test_list_routes_endpoint_filters_by_vehicle_id(client, fake: Faker):
    """Test GET /rutas filters by vehicle_id query parameter."""
    # Create two vehicles
    vehicle1_payload = {
        "placa": fake.unique.bothify(text="???-###"),
        "conductor": fake.name(),
        "numero_entregas": 0,
    }
    vehicle1_response = client.post("/vehiculos", json=vehicle1_payload)
    vehicle1_id = vehicle1_response.json()["id"]

    vehicle2_payload = {
        "placa": fake.unique.bothify(text="???-###"),
        "conductor": fake.name(),
        "numero_entregas": 0,
    }
    vehicle2_response = client.post("/vehiculos", json=vehicle2_payload)
    vehicle2_id = vehicle2_response.json()["id"]

    # Create routes for both vehicles
    for _ in range(2):
        client.post(
            "/rutas",
            json={
                "vehicle_id": vehicle1_id,
                "date": date.today().isoformat(),
                "total_distance_km": 10.0,
                "estimated_time_h": 0.5,
            },
        )

    for _ in range(3):
        client.post(
            "/rutas",
            json={
                "vehicle_id": vehicle2_id,
                "date": date.today().isoformat(),
                "total_distance_km": 10.0,
                "estimated_time_h": 0.5,
            },
        )

    # Filter by vehicle1
    response = client.get("/rutas", params={"vehicle_id": vehicle1_id})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    for route in data["data"]:
        assert route["vehicleId"] == vehicle1_id

    # Filter by vehicle2
    response = client.get("/rutas", params={"vehicle_id": vehicle2_id})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    for route in data["data"]:
        assert route["vehicleId"] == vehicle2_id


def test_get_route_endpoint_returns_route_with_stops(client, fake: Faker):
    """Test GET /rutas/{route_id} returns route with stops."""
    # Create vehicle and route
    vehicle_response = client.post(
        "/vehiculos",
        json={"placa": fake.unique.bothify(text="???-###"), "conductor": fake.name(), "numero_entregas": 0},
    )
    vehicle_id = vehicle_response.json()["id"]

    route_response = client.post(
        "/rutas",
        json={
            "vehicle_id": vehicle_id,
            "date": date.today().isoformat(),
            "total_distance_km": 10.0,
            "estimated_time_h": 0.5,
        },
    )
    route_id = route_response.json()["id"]

    # Create stops
    for i in range(3):
        client.post(
            "/paradas",
            json={
                "route_id": route_id,
                "client_id": fake.uuid4(),
                "sequence": i + 1,
                "latitude": 4.6097,
                "longitude": -74.0817,
                "delivered": False,
            },
        )

    # Get route
    response = client.get(f"/rutas/{route_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == route_id
    assert "stops" in data
    assert len(data["stops"]) == 3


def test_get_route_endpoint_returns_404_for_nonexistent_route(client):
    """Test GET /rutas/{route_id} returns 404 for non-existent route."""
    response = client.get("/rutas/non-existent-id")
    assert response.status_code == 404


def test_update_route_endpoint_success(client, fake: Faker):
    """Test PATCH /rutas/{route_id} updates a route."""
    # Create vehicle and route
    vehicle_response = client.post(
        "/vehiculos",
        json={"placa": fake.unique.bothify(text="???-###"), "conductor": fake.name(), "numero_entregas": 0},
    )
    vehicle_id = vehicle_response.json()["id"]

    route_response = client.post(
        "/rutas",
        json={
            "vehicle_id": vehicle_id,
            "date": date.today().isoformat(),
            "total_distance_km": 10.0,
            "estimated_time_h": 0.5,
            "status": "pending",
        },
    )
    route_id = route_response.json()["id"]

    # Update route
    update_payload = {
        "total_distance_km": 25.5,
        "estimated_time_h": 2.0,
        "status": "completed",
    }

    response = client.patch(f"/rutas/{route_id}", json=update_payload)
    assert response.status_code == 200

    data = response.json()
    assert data["totalDistanceKm"] == 25.5
    assert data["estimatedTimeH"] == 2.0
    assert data["status"] == "completed"


def test_update_route_endpoint_returns_404_for_nonexistent_route(client):
    """Test PATCH /rutas/{route_id} returns 404 for non-existent route."""
    response = client.patch("/rutas/non-existent-id", json={"status": "completed"})
    assert response.status_code == 404


def test_delete_route_endpoint_success(client, fake: Faker):
    """Test DELETE /rutas/{route_id} deletes a route."""
    # Create vehicle and route
    vehicle_response = client.post(
        "/vehiculos",
        json={"placa": fake.unique.bothify(text="???-###"), "conductor": fake.name(), "numero_entregas": 0},
    )
    vehicle_id = vehicle_response.json()["id"]

    route_response = client.post(
        "/rutas",
        json={
            "vehicle_id": vehicle_id,
            "date": date.today().isoformat(),
            "total_distance_km": 10.0,
            "estimated_time_h": 0.5,
        },
    )
    route_id = route_response.json()["id"]

    # Delete route
    response = client.delete(f"/rutas/{route_id}")
    assert response.status_code == 200
    assert "deleted successfully" in response.json()["message"].lower()

    # Verify deletion
    get_response = client.get(f"/rutas/{route_id}")
    assert get_response.status_code == 404


def test_delete_route_endpoint_returns_404_for_nonexistent_route(client):
    """Test DELETE /rutas/{route_id} returns 404 for non-existent route."""
    response = client.delete("/rutas/non-existent-id")
    assert response.status_code == 404


def test_optimize_route_endpoint_success(client, fake: Faker):
    """Test POST /rutas/{route_id}/optimize optimizes a route."""
    # Create vehicle and route
    vehicle_response = client.post(
        "/vehiculos",
        json={"placa": fake.unique.bothify(text="???-###"), "conductor": fake.name(), "numero_entregas": 0},
    )
    vehicle_id = vehicle_response.json()["id"]

    route_response = client.post(
        "/rutas",
        json={
            "vehicle_id": vehicle_id,
            "date": date.today().isoformat(),
            "total_distance_km": 0.0,
            "estimated_time_h": 0.0,
        },
    )
    route_id = route_response.json()["id"]

    # Create stops in unoptimized order
    stops_data = [
        {"lat": 4.6097, "lon": -74.0817, "seq": 1},
        {"lat": 4.5981, "lon": -74.0761, "seq": 2},
        {"lat": 4.6534, "lon": -74.0548, "seq": 3},
        {"lat": 4.6486, "lon": -74.0645, "seq": 4},
    ]

    for stop_data in stops_data:
        client.post(
            "/paradas",
            json={
                "route_id": route_id,
                "client_id": fake.uuid4(),
                "sequence": stop_data["seq"],
                "latitude": stop_data["lat"],
                "longitude": stop_data["lon"],
                "delivered": False,
            },
        )

    # Optimize route
    response = client.post(
        f"/rutas/{route_id}/optimize",
        params={"start_lat": 4.61, "start_lon": -74.08, "avg_speed_kmh": 40.0},
    )

    assert response.status_code == 200
    data = response.json()

    # Verify metrics were calculated
    assert data["totalDistanceKm"] > 0
    assert data["estimatedTimeH"] > 0

    # Verify stops are included
    assert "stops" in data
    assert len(data["stops"]) == 4

    # Verify stops are ordered by sequence
    sequences = [stop["sequence"] for stop in data["stops"]]
    assert sequences == [1, 2, 3, 4]


def test_optimize_route_endpoint_returns_404_for_nonexistent_route(client):
    """Test POST /rutas/{route_id}/optimize returns 404 for non-existent route."""
    response = client.post("/rutas/non-existent-id/optimize")
    assert response.status_code == 404


def test_optimize_route_endpoint_returns_400_for_route_without_stops(client, fake: Faker):
    """Test POST /rutas/{route_id}/optimize returns 400 for route without stops."""
    # Create vehicle and route without stops
    vehicle_response = client.post(
        "/vehiculos",
        json={"placa": fake.unique.bothify(text="???-###"), "conductor": fake.name(), "numero_entregas": 0},
    )
    vehicle_id = vehicle_response.json()["id"]

    route_response = client.post(
        "/rutas",
        json={
            "vehicle_id": vehicle_id,
            "date": date.today().isoformat(),
            "total_distance_km": 0.0,
            "estimated_time_h": 0.0,
        },
    )
    route_id = route_response.json()["id"]

    # Try to optimize route without stops
    response = client.post(f"/rutas/{route_id}/optimize")
    assert response.status_code == 400
    assert "no stops" in response.json()["detail"].lower()


def test_list_routes_endpoint_validates_query_params(client):
    """Test GET /rutas validates query parameters."""
    # Invalid page (0) - FastAPI validation returns 422
    response = client.get("/rutas", params={"page": 0, "limit": 10})
    assert response.status_code == 422

    # Invalid limit (0)
    response = client.get("/rutas", params={"page": 1, "limit": 0})
    assert response.status_code == 422


def test_list_routes_endpoint_handles_empty_results(client):
    """Test GET /rutas handles empty database correctly."""
    response = client.get("/rutas", params={"page": 1, "limit": 10})
    assert response.status_code == 200

    payload = response.json()
    assert payload["total"] == 0
    assert payload["total_pages"] == 0
    assert len(payload["data"]) == 0


__all__ = []
