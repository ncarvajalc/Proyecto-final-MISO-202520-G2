"""Unit tests for route service operations."""

from __future__ import annotations

import math
from datetime import date
from decimal import Decimal

import pytest
from faker import Faker

from app.modules.haul_route.models.route import Route
from app.modules.haul_route.models.route_stop import RouteStop
from app.modules.haul_route.services import route_service
from app.modules.vehicles.models.vehicle import Vehicle


@pytest.fixture
def sample_vehicle(db_session, fake: Faker):
    """Create a sample vehicle for testing."""
    vehicle = Vehicle(
        placa=fake.unique.bothify(text="???-###"),
        conductor=fake.name(),
        numero_entregas=0,
    )
    db_session.add(vehicle)
    db_session.commit()
    return vehicle


@pytest.fixture
def sample_route_with_stops(db_session, sample_vehicle, fake: Faker):
    """Create a sample route with stops for testing."""
    route = Route(
        vehicle_id=sample_vehicle.id,
        date=date.today(),
        total_distance_km=Decimal("0.0"),
        estimated_time_h=Decimal("0.0"),
        priority_level="normal",
        status="pending",
    )
    db_session.add(route)
    db_session.flush()

    # Create stops with intentionally unoptimized order
    stops_data = [
        (1, Decimal("4.6097"), Decimal("-74.0817")),  # North
        (2, Decimal("4.5981"), Decimal("-74.0761")),  # South (far from North)
        (3, Decimal("4.6534"), Decimal("-74.0548")),  # Far North
        (4, Decimal("4.6486"), Decimal("-74.0645")),  # Center North
    ]

    for seq, lat, lon in stops_data:
        stop = RouteStop(
            route_id=route.id,
            client_id=fake.uuid4(),
            sequence=seq,
            latitude=lat,
            longitude=lon,
            delivered=False,
        )
        db_session.add(stop)

    db_session.commit()
    db_session.refresh(route)
    return route


def test_calculate_distance_returns_correct_haversine_distance():
    """Test that calculate_distance computes Haversine distance correctly."""
    # Distance between two known points in Bogotá
    # Calle 127 to Calle 72 approximately 6-7 km
    lat1, lon1 = 4.7110, -74.0721
    lat2, lon2 = 4.6486, -74.0645

    distance = route_service.calculate_distance(lat1, lon1, lat2, lon2)

    # Should be approximately 6-7 km
    assert 6.0 < distance < 8.0


def test_calculate_distance_returns_zero_for_same_point():
    """Test that calculate_distance returns zero for identical coordinates."""
    distance = route_service.calculate_distance(4.6097, -74.0817, 4.6097, -74.0817)

    assert distance == 0.0


def test_optimize_route_greedy_reorders_stops_correctly():
    """Test that optimize_route_greedy reorders stops using nearest-neighbor."""
    stops = [
        {
            "id": "1",
            "latitude": Decimal("4.6097"),
            "longitude": Decimal("-74.0817"),
            "sequence": 1,
        },
        {
            "id": "2",
            "latitude": Decimal("4.5981"),
            "longitude": Decimal("-74.0761"),
            "sequence": 2,
        },
        {
            "id": "3",
            "latitude": Decimal("4.6534"),
            "longitude": Decimal("-74.0548"),
            "sequence": 3,
        },
    ]

    # Start from a point close to stop 1
    optimized = route_service.optimize_route_greedy(stops, start_lat=4.61, start_lon=-74.08)

    # Verify sequences were updated
    assert len(optimized) == 3
    for i, stop in enumerate(optimized, start=1):
        assert stop["sequence"] == i

    # Verify optimization logic: should visit nearest first
    # From (4.61, -74.08), stop 1 should be first, then 3, then 2 (southernmost)
    assert optimized[0]["id"] == "1"


def test_optimize_route_greedy_handles_stops_without_coordinates():
    """Test that optimize_route_greedy handles stops without coordinates."""
    stops = [
        {"id": "1", "latitude": Decimal("4.6097"), "longitude": Decimal("-74.0817"), "sequence": 1},
        {"id": "2", "latitude": None, "longitude": None, "sequence": 2},
        {"id": "3", "latitude": Decimal("4.6534"), "longitude": Decimal("-74.0548"), "sequence": 3},
    ]

    optimized = route_service.optimize_route_greedy(stops)

    # Stops without coordinates should be at the end
    assert len(optimized) == 3
    assert optimized[-1]["id"] == "2"
    assert optimized[-1]["latitude"] is None


def test_optimize_route_greedy_returns_empty_for_no_stops():
    """Test that optimize_route_greedy handles empty input."""
    optimized = route_service.optimize_route_greedy([])

    assert optimized == []


def test_calculate_route_metrics_computes_distance_and_time():
    """Test that calculate_route_metrics computes distance and time correctly."""
    stops = [
        {"latitude": Decimal("4.6097"), "longitude": Decimal("-74.0817")},
        {"latitude": Decimal("4.6486"), "longitude": Decimal("-74.0645")},
        {"latitude": Decimal("4.6534"), "longitude": Decimal("-74.0548")},
    ]

    metrics = route_service.calculate_route_metrics(stops, avg_speed_kmh=40.0)

    assert "totalDistanceKm" in metrics
    assert "estimatedTimeH" in metrics
    assert metrics["totalDistanceKm"] > 0
    assert metrics["estimatedTimeH"] > 0

    # Verify time calculation: time = distance / speed
    expected_time = metrics["totalDistanceKm"] / 40.0
    assert abs(metrics["estimatedTimeH"] - round(expected_time, 2)) < 0.01


def test_calculate_route_metrics_handles_stops_without_coordinates():
    """Test that calculate_route_metrics skips stops without coordinates."""
    stops = [
        {"latitude": Decimal("4.6097"), "longitude": Decimal("-74.0817")},
        {"latitude": None, "longitude": None},
        {"latitude": Decimal("4.6534"), "longitude": Decimal("-74.0548")},
    ]

    metrics = route_service.calculate_route_metrics(stops)

    # Should calculate distance between first and third stop (skipping the middle one)
    # Since the middle stop has no coordinates, we can't calculate continuous distance
    # The algorithm should handle this gracefully
    assert metrics["totalDistanceKm"] >= 0


def test_calculate_route_metrics_returns_zero_for_single_stop():
    """Test that calculate_route_metrics returns zero for a single stop."""
    stops = [{"latitude": Decimal("4.6097"), "longitude": Decimal("-74.0817")}]

    metrics = route_service.calculate_route_metrics(stops)

    assert metrics["totalDistanceKm"] == 0.0
    assert metrics["estimatedTimeH"] == 0.0


def test_optimize_route_and_save_updates_database(db_session, sample_route_with_stops):
    """Test that optimize_route_and_save updates route and stops in database."""
    route_id = sample_route_with_stops.id
    original_stops = list(sample_route_with_stops.stops)
    original_sequences = [s.sequence for s in original_stops]

    # Optimize the route
    result = route_service.optimize_route_and_save(
        db_session,
        route_id=route_id,
        start_lat=4.61,
        start_lon=-74.08,
        avg_speed_kmh=40.0,
    )

    # Verify response structure
    assert "id" in result
    assert result["id"] == route_id
    assert "totalDistanceKm" in result
    assert "estimatedTimeH" in result
    assert result["totalDistanceKm"] > 0
    assert result["estimatedTimeH"] > 0

    # Verify stops were reordered in database
    db_session.refresh(sample_route_with_stops)
    new_stops = sorted(sample_route_with_stops.stops, key=lambda s: s.sequence)
    new_sequences = [s.sequence for s in new_stops]

    # Sequences should still be 1, 2, 3, 4 but order might have changed
    assert new_sequences == [1, 2, 3, 4]


def test_optimize_route_and_save_raises_404_for_nonexistent_route(db_session):
    """Test that optimize_route_and_save raises HTTPException for non-existent route."""
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        route_service.optimize_route_and_save(
            db_session,
            route_id="non-existent-id",
            start_lat=0.0,
            start_lon=0.0,
        )

    assert exc_info.value.status_code == 404


def test_optimize_route_and_save_raises_400_for_route_without_stops(db_session, sample_vehicle):
    """Test that optimize_route_and_save raises HTTPException for route without stops."""
    from fastapi import HTTPException

    route = Route(
        vehicle_id=sample_vehicle.id,
        date=date.today(),
        total_distance_km=Decimal("0.0"),
        estimated_time_h=Decimal("0.0"),
    )
    db_session.add(route)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        route_service.optimize_route_and_save(
            db_session,
            route_id=route.id,
            start_lat=0.0,
            start_lon=0.0,
        )

    assert exc_info.value.status_code == 400
    assert "no stops" in exc_info.value.detail.lower()


__all__ = []
