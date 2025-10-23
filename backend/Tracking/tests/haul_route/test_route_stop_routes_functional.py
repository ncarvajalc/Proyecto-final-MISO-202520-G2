"""Functional tests for route stop endpoints."""

from __future__ import annotations

from datetime import date

from faker import Faker


def test_create_route_stop_endpoint_success(client, fake: Faker):
    """Test POST /paradas creates a route stop successfully."""
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

    # Create stop
    stop_payload = {
        "route_id": route_id,
        "client_id": fake.uuid4(),
        "sequence": 1,
        "latitude": 4.6097,
        "longitude": -74.0817,
        "address": fake.address(),
        "delivered": False,
    }

    response = client.post("/paradas", json=stop_payload)

    assert response.status_code == 201
    data = response.json()
    assert data["routeId"] == route_id
    assert data["clientId"] == stop_payload["client_id"]
    assert data["sequence"] == 1
    assert data["latitude"] == 4.6097
    assert data["longitude"] == -74.0817
    assert data["delivered"] is False
    assert "id" in data
    assert "createdAt" in data
    assert "updatedAt" in data


def test_create_route_stop_endpoint_validates_required_fields(client):
    """Test POST /paradas validates required fields."""
    # Missing route_id
    payload = {
        "client_id": "some-client",
        "sequence": 1,
    }
    response = client.post("/paradas", json=payload)
    assert response.status_code == 422

    # Missing client_id
    payload = {
        "route_id": "some-route",
        "sequence": 1,
    }
    response = client.post("/paradas", json=payload)
    assert response.status_code == 422

    # Missing sequence
    payload = {
        "route_id": "some-route",
        "client_id": "some-client",
    }
    response = client.post("/paradas", json=payload)
    assert response.status_code == 422


def test_create_route_stop_endpoint_validates_coordinates(client, fake: Faker):
    """Test POST /paradas validates latitude and longitude ranges."""
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

    # Invalid latitude (> 90)
    payload = {
        "route_id": route_id,
        "client_id": fake.uuid4(),
        "sequence": 1,
        "latitude": 91.0,
        "longitude": -74.0817,
    }
    response = client.post("/paradas", json=payload)
    assert response.status_code == 422

    # Invalid longitude (< -180)
    payload = {
        "route_id": route_id,
        "client_id": fake.uuid4(),
        "sequence": 1,
        "latitude": 4.6097,
        "longitude": -181.0,
    }
    response = client.post("/paradas", json=payload)
    assert response.status_code == 422


def test_list_route_stops_endpoint_returns_stops_for_route(client, fake: Faker):
    """Test GET /paradas returns stops for a specific route."""
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

    # Create 3 stops
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

    # Get stops for route
    response = client.get("/paradas", params={"route_id": route_id})
    assert response.status_code == 200

    payload = response.json()
    assert payload["total"] == 3
    assert len(payload["data"]) == 3

    # Verify stops are ordered by sequence
    sequences = [stop["sequence"] for stop in payload["data"]]
    assert sequences == [1, 2, 3]


def test_list_route_stops_endpoint_requires_route_id(client):
    """Test GET /paradas requires route_id query parameter."""
    response = client.get("/paradas")
    assert response.status_code == 422


def test_list_route_stops_endpoint_handles_empty_results(client, fake: Faker):
    """Test GET /paradas handles route with no stops."""
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

    response = client.get("/paradas", params={"route_id": route_id})
    assert response.status_code == 200

    payload = response.json()
    assert payload["total"] == 0
    assert len(payload["data"]) == 0


def test_get_route_stop_endpoint_returns_stop(client, fake: Faker):
    """Test GET /paradas/{stop_id} returns a specific stop."""
    # Create vehicle, route, and stop
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

    stop_response = client.post(
        "/paradas",
        json={
            "route_id": route_id,
            "client_id": fake.uuid4(),
            "sequence": 1,
            "latitude": 4.6097,
            "longitude": -74.0817,
            "delivered": False,
        },
    )
    stop_id = stop_response.json()["id"]

    # Get stop
    response = client.get(f"/paradas/{stop_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == stop_id
    assert data["routeId"] == route_id
    assert data["sequence"] == 1


def test_get_route_stop_endpoint_returns_404_for_nonexistent_stop(client):
    """Test GET /paradas/{stop_id} returns 404 for non-existent stop."""
    response = client.get("/paradas/non-existent-id")
    assert response.status_code == 404


def test_update_route_stop_endpoint_success(client, fake: Faker):
    """Test PATCH /paradas/{stop_id} updates a stop."""
    # Create vehicle, route, and stop
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

    stop_response = client.post(
        "/paradas",
        json={
            "route_id": route_id,
            "client_id": fake.uuid4(),
            "sequence": 1,
            "latitude": 4.6097,
            "longitude": -74.0817,
            "delivered": False,
        },
    )
    stop_id = stop_response.json()["id"]

    # Update stop
    update_payload = {
        "sequence": 2,
        "delivered": True,
        "latitude": 4.7110,
        "longitude": -74.0721,
    }

    response = client.patch(f"/paradas/{stop_id}", json=update_payload)
    assert response.status_code == 200

    data = response.json()
    assert data["sequence"] == 2
    assert data["delivered"] is True
    assert data["latitude"] == 4.7110
    assert data["longitude"] == -74.0721


def test_update_route_stop_endpoint_returns_404_for_nonexistent_stop(client):
    """Test PATCH /paradas/{stop_id} returns 404 for non-existent stop."""
    response = client.patch("/paradas/non-existent-id", json={"delivered": True})
    assert response.status_code == 404


def test_delete_route_stop_endpoint_success(client, fake: Faker):
    """Test DELETE /paradas/{stop_id} deletes a stop."""
    # Create vehicle, route, and stop
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

    stop_response = client.post(
        "/paradas",
        json={
            "route_id": route_id,
            "client_id": fake.uuid4(),
            "sequence": 1,
            "latitude": 4.6097,
            "longitude": -74.0817,
            "delivered": False,
        },
    )
    stop_id = stop_response.json()["id"]

    # Delete stop
    response = client.delete(f"/paradas/{stop_id}")
    assert response.status_code == 200
    assert "deleted successfully" in response.json()["message"].lower()

    # Verify deletion
    get_response = client.get(f"/paradas/{stop_id}")
    assert get_response.status_code == 404


def test_delete_route_stop_endpoint_returns_404_for_nonexistent_stop(client):
    """Test DELETE /paradas/{stop_id} returns 404 for non-existent stop."""
    response = client.delete("/paradas/non-existent-id")
    assert response.status_code == 404


def test_list_route_stops_endpoint_supports_pagination(client, fake: Faker):
    """Test GET /paradas supports pagination."""
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

    # Create 5 stops
    for i in range(5):
        client.post(
            "/paradas",
            json={
                "route_id": route_id,
                "client_id": fake.uuid4(),
                "sequence": i + 1,
                "delivered": False,
            },
        )

    # Get first page
    response = client.get("/paradas", params={"route_id": route_id, "page": 1, "limit": 2})
    assert response.status_code == 200
    first_page = response.json()
    assert first_page["total"] == 5
    assert len(first_page["data"]) == 2
    assert first_page["page"] == 1
    assert first_page["total_pages"] == 3

    # Get second page
    response = client.get("/paradas", params={"route_id": route_id, "page": 2, "limit": 2})
    second_page = response.json()
    assert len(second_page["data"]) == 2

    # Verify no overlap
    first_page_ids = {stop["id"] for stop in first_page["data"]}
    second_page_ids = {stop["id"] for stop in second_page["data"]}
    assert first_page_ids.isdisjoint(second_page_ids)


__all__ = []
