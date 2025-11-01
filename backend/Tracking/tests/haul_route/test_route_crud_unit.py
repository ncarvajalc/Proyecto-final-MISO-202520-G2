"""Unit tests for route CRUD operations."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from decimal import Decimal

import pytest
from faker import Faker

from app.modules.haul_route.crud import crud_route
from app.modules.haul_route.models.route import Route
from app.modules.haul_route.schemas.route import RouteCreate, RouteUpdate
from app.modules.vehicles.models.vehicle import Vehicle


@pytest.fixture
def sample_vehicle(db_session, fake: Faker):
    """Create a sample vehicle for testing."""
    vehicle = Vehicle(
        placa=fake.unique.bothify(text="???-###"),
        conductor=fake.name(),
        numero_entregas=fake.random_int(min=0, max=20),
    )
    db_session.add(vehicle)
    db_session.commit()
    return vehicle


def test_create_route_persists_to_database(db_session, sample_vehicle):
    """Test that create_route persists a new route to the database."""
    route_data = RouteCreate(
        vehicle_id=sample_vehicle.id,
        date=date.today(),
        total_distance_km=Decimal("25.5"),
        estimated_time_h=Decimal("1.5"),
        priority_level="high",
        status="pending",
    )

    created = crud_route.create_route(db_session, route_data)

    assert created.id is not None
    assert created.vehicle_id == sample_vehicle.id
    assert created.date == date.today()
    assert created.total_distance_km == Decimal("25.5")
    assert created.estimated_time_h == Decimal("1.5")
    assert created.priority_level == "high"
    assert created.status == "pending"
    assert created.created_at is not None
    assert created.updated_at is not None

    # Verify in database
    stored = db_session.query(Route).filter_by(id=created.id).first()
    assert stored is not None
    assert stored.vehicle_id == sample_vehicle.id


def test_get_route_returns_route_by_id(db_session, sample_vehicle):
    """Test that get_route retrieves a route by ID."""
    route = Route(
        vehicle_id=sample_vehicle.id,
        date=date.today(),
        total_distance_km=Decimal("15.0"),
        estimated_time_h=Decimal("1.0"),
        priority_level="normal",
        status="pending",
    )
    db_session.add(route)
    db_session.commit()

    retrieved = crud_route.get_route(db_session, route.id)

    assert retrieved is not None
    assert retrieved.id == route.id
    assert retrieved.vehicle_id == sample_vehicle.id
    assert retrieved.priority_level == "normal"


def test_get_route_returns_none_when_not_found(db_session):
    """Test that get_route returns None for non-existent ID."""
    retrieved = crud_route.get_route(db_session, "non-existent-id")

    assert retrieved is None


def test_get_routes_by_vehicle_returns_filtered_results(db_session, fake: Faker):
    """Test that get_routes_by_vehicle returns only routes for specific vehicle."""
    # Create two vehicles
    vehicle1 = Vehicle(
        placa=fake.unique.bothify(text="???-###"),
        conductor=fake.name(),
        numero_entregas=0,
    )
    vehicle2 = Vehicle(
        placa=fake.unique.bothify(text="???-###"),
        conductor=fake.name(),
        numero_entregas=0,
    )
    db_session.add_all([vehicle1, vehicle2])
    db_session.commit()

    # Create routes for vehicle1
    for _ in range(3):
        route = Route(
            vehicle_id=vehicle1.id,
            date=date.today(),
            total_distance_km=Decimal("10.0"),
            estimated_time_h=Decimal("0.5"),
        )
        db_session.add(route)

    # Create routes for vehicle2
    for _ in range(2):
        route = Route(
            vehicle_id=vehicle2.id,
            date=date.today(),
            total_distance_km=Decimal("10.0"),
            estimated_time_h=Decimal("0.5"),
        )
        db_session.add(route)
    db_session.commit()

    # Get routes for vehicle1
    result = crud_route.get_routes_by_vehicle(db_session, vehicle1.id, skip=0, limit=10)

    assert result["total"] == 3
    assert len(result["routes"]) == 3
    for route in result["routes"]:
        assert route.vehicle_id == vehicle1.id


def test_get_routes_all_returns_paginated_results(db_session, sample_vehicle):
    """Test that get_routes_all returns paginated list of routes."""
    # Create 5 routes
    for _ in range(5):
        route = Route(
            vehicle_id=sample_vehicle.id,
            date=date.today(),
            total_distance_km=Decimal("10.0"),
            estimated_time_h=Decimal("0.5"),
        )
        db_session.add(route)
    db_session.commit()

    # Get first 3
    result = crud_route.get_routes_all(db_session, skip=0, limit=3)

    assert result["total"] == 5
    assert len(result["routes"]) == 3

    # Get next 2
    result = crud_route.get_routes_all(db_session, skip=3, limit=3)

    assert result["total"] == 5
    assert len(result["routes"]) == 2


def test_get_routes_all_returns_empty_when_no_routes(db_session):
    """Test that get_routes_all returns empty list when no routes exist."""
    result = crud_route.get_routes_all(db_session, skip=0, limit=10)

    assert result["total"] == 0
    assert len(result["routes"]) == 0


def test_update_route_modifies_existing_route(db_session, sample_vehicle):
    """Test that update_route modifies an existing route."""
    route = Route(
        vehicle_id=sample_vehicle.id,
        date=date.today(),
        total_distance_km=Decimal("10.0"),
        estimated_time_h=Decimal("0.5"),
        priority_level="normal",
        status="pending",
    )
    db_session.add(route)
    db_session.commit()

    update_data = RouteUpdate(
        total_distance_km=Decimal("25.5"),
        estimated_time_h=Decimal("2.0"),
        priority_level="high",
        status="in_progress",
    )

    updated = crud_route.update_route(db_session, route.id, update_data)

    assert updated is not None
    assert updated.id == route.id
    assert updated.total_distance_km == Decimal("25.5")
    assert updated.estimated_time_h == Decimal("2.0")
    assert updated.priority_level == "high"
    assert updated.status == "in_progress"


def test_update_route_returns_none_when_not_found(db_session):
    """Test that update_route returns None for non-existent ID."""
    update_data = RouteUpdate(status="completed")

    updated = crud_route.update_route(db_session, "non-existent-id", update_data)

    assert updated is None


def test_delete_route_removes_from_database(db_session, sample_vehicle):
    """Test that delete_route removes a route from the database."""
    route = Route(
        vehicle_id=sample_vehicle.id,
        date=date.today(),
        total_distance_km=Decimal("10.0"),
        estimated_time_h=Decimal("0.5"),
    )
    db_session.add(route)
    db_session.commit()
    route_id = route.id

    success = crud_route.delete_route(db_session, route_id)

    assert success is True

    # Verify deletion
    deleted = db_session.query(Route).filter_by(id=route_id).first()
    assert deleted is None


def test_delete_route_returns_false_when_not_found(db_session):
    """Test that delete_route returns False for non-existent ID."""
    success = crud_route.delete_route(db_session, "non-existent-id")

    assert success is False


__all__ = []
