"""Unit tests for route stop CRUD operations."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

import pytest
from faker import Faker

from app.modules.haul_route.crud import crud_route_stop
from app.modules.haul_route.models.route import Route
from app.modules.haul_route.models.route_stop import RouteStop
from app.modules.haul_route.schemas.route_stop import RouteStopCreate, RouteStopUpdate
from app.modules.vehicles.models.vehicle import Vehicle


@pytest.fixture
def sample_route(db_session, fake: Faker):
    """Create a sample route for testing."""
    vehicle = Vehicle(
        placa=fake.unique.bothify(text="???-###"),
        conductor=fake.name(),
        numero_entregas=0,
    )
    db_session.add(vehicle)
    db_session.commit()

    route = Route(
        vehicle_id=vehicle.id,
        date=date.today(),
        total_distance_km=Decimal("0.0"),
        estimated_time_h=Decimal("0.0"),
    )
    db_session.add(route)
    db_session.commit()
    return route


def test_create_route_stop_persists_to_database(db_session, sample_route, fake: Faker):
    """Test that create_route_stop persists a new stop to the database."""
    stop_data = RouteStopCreate(
        route_id=sample_route.id,
        client_id=fake.uuid4(),
        sequence=1,
        latitude=Decimal("4.6097"),
        longitude=Decimal("-74.0817"),
        address=fake.address(),
        delivered=False,
    )

    created = crud_route_stop.create_route_stop(db_session, stop_data)

    assert created.id is not None
    assert created.route_id == sample_route.id
    assert created.client_id == stop_data.client_id
    assert created.sequence == 1
    assert created.latitude == Decimal("4.6097")
    assert created.longitude == Decimal("-74.0817")
    assert created.delivered is False
    assert created.created_at is not None
    assert created.updated_at is not None

    # Verify in database
    stored = db_session.query(RouteStop).filter_by(id=created.id).first()
    assert stored is not None
    assert stored.route_id == sample_route.id


def test_get_route_stop_returns_stop_by_id(db_session, sample_route, fake: Faker):
    """Test that get_route_stop retrieves a stop by ID."""
    stop = RouteStop(
        route_id=sample_route.id,
        client_id=fake.uuid4(),
        sequence=1,
        latitude=Decimal("4.6097"),
        longitude=Decimal("-74.0817"),
        delivered=False,
    )
    db_session.add(stop)
    db_session.commit()

    retrieved = crud_route_stop.get_route_stop(db_session, stop.id)

    assert retrieved is not None
    assert retrieved.id == stop.id
    assert retrieved.route_id == sample_route.id
    assert retrieved.sequence == 1


def test_get_route_stop_returns_none_when_not_found(db_session):
    """Test that get_route_stop returns None for non-existent ID."""
    retrieved = crud_route_stop.get_route_stop(db_session, "non-existent-id")

    assert retrieved is None


def test_get_route_stops_by_route_returns_ordered_results(db_session, sample_route, fake: Faker):
    """Test that get_route_stops_by_route returns stops ordered by sequence."""
    # Create stops in random order
    sequences = [3, 1, 2]
    for seq in sequences:
        stop = RouteStop(
            route_id=sample_route.id,
            client_id=fake.uuid4(),
            sequence=seq,
            latitude=Decimal("4.6097"),
            longitude=Decimal("-74.0817"),
            delivered=False,
        )
        db_session.add(stop)
    db_session.commit()

    result = crud_route_stop.get_route_stops_by_route(db_session, sample_route.id)

    assert result["total"] == 3
    assert len(result["stops"]) == 3

    # Verify ordering
    sequences_returned = [stop.sequence for stop in result["stops"]]
    assert sequences_returned == [1, 2, 3]


def test_get_route_stops_by_route_filters_by_route_id(db_session, fake: Faker):
    """Test that get_route_stops_by_route returns only stops for specific route."""
    # Create two vehicles and routes
    vehicle = Vehicle(placa=fake.unique.bothify(text="???-###"), conductor=fake.name(), numero_entregas=0)
    db_session.add(vehicle)
    db_session.commit()

    route1 = Route(vehicle_id=vehicle.id, date=date.today(), total_distance_km=Decimal("0.0"), estimated_time_h=Decimal("0.0"))
    route2 = Route(vehicle_id=vehicle.id, date=date.today(), total_distance_km=Decimal("0.0"), estimated_time_h=Decimal("0.0"))
    db_session.add_all([route1, route2])
    db_session.commit()

    # Create stops for route1
    for i in range(3):
        stop = RouteStop(
            route_id=route1.id,
            client_id=fake.uuid4(),
            sequence=i + 1,
            delivered=False,
        )
        db_session.add(stop)

    # Create stops for route2
    for i in range(2):
        stop = RouteStop(
            route_id=route2.id,
            client_id=fake.uuid4(),
            sequence=i + 1,
            delivered=False,
        )
        db_session.add(stop)
    db_session.commit()

    # Get stops for route1
    result = crud_route_stop.get_route_stops_by_route(db_session, route1.id)

    assert result["total"] == 3
    assert len(result["stops"]) == 3
    for stop in result["stops"]:
        assert stop.route_id == route1.id


def test_get_route_stops_by_route_returns_empty_when_no_stops(db_session, sample_route):
    """Test that get_route_stops_by_route returns empty list when no stops exist."""
    result = crud_route_stop.get_route_stops_by_route(db_session, sample_route.id)

    assert result["total"] == 0
    assert len(result["stops"]) == 0


def test_update_route_stop_modifies_existing_stop(db_session, sample_route, fake: Faker):
    """Test that update_route_stop modifies an existing stop."""
    stop = RouteStop(
        route_id=sample_route.id,
        client_id=fake.uuid4(),
        sequence=1,
        latitude=Decimal("4.6097"),
        longitude=Decimal("-74.0817"),
        delivered=False,
    )
    db_session.add(stop)
    db_session.commit()

    update_data = RouteStopUpdate(
        sequence=2,
        delivered=True,
        latitude=Decimal("4.7110"),
        longitude=Decimal("-74.0721"),
    )

    updated = crud_route_stop.update_route_stop(db_session, stop.id, update_data)

    assert updated is not None
    assert updated.id == stop.id
    assert updated.sequence == 2
    assert updated.delivered is True
    assert updated.latitude == Decimal("4.7110")
    assert updated.longitude == Decimal("-74.0721")


def test_update_route_stop_returns_none_when_not_found(db_session):
    """Test that update_route_stop returns None for non-existent ID."""
    update_data = RouteStopUpdate(delivered=True)

    updated = crud_route_stop.update_route_stop(db_session, "non-existent-id", update_data)

    assert updated is None


def test_delete_route_stop_removes_from_database(db_session, sample_route, fake: Faker):
    """Test that delete_route_stop removes a stop from the database."""
    stop = RouteStop(
        route_id=sample_route.id,
        client_id=fake.uuid4(),
        sequence=1,
        delivered=False,
    )
    db_session.add(stop)
    db_session.commit()
    stop_id = stop.id

    success = crud_route_stop.delete_route_stop(db_session, stop_id)

    assert success is True

    # Verify deletion
    deleted = db_session.query(RouteStop).filter_by(id=stop_id).first()
    assert deleted is None


def test_delete_route_stop_returns_false_when_not_found(db_session):
    """Test that delete_route_stop returns False for non-existent ID."""
    success = crud_route_stop.delete_route_stop(db_session, "non-existent-id")

    assert success is False


def test_create_route_stops_bulk_creates_multiple_stops(db_session, sample_route, fake: Faker):
    """Test that create_route_stops_bulk creates multiple stops at once."""
    stops_data = [
        RouteStopCreate(
            route_id=sample_route.id,
            client_id=fake.uuid4(),
            sequence=i + 1,
            latitude=Decimal("4.6097"),
            longitude=Decimal("-74.0817"),
            delivered=False,
        )
        for i in range(3)
    ]

    created_stops = crud_route_stop.create_route_stops_bulk(db_session, stops_data)

    assert len(created_stops) == 3
    for i, stop in enumerate(created_stops):
        assert stop.id is not None
        assert stop.route_id == sample_route.id
        assert stop.sequence == i + 1

    # Verify in database
    result = crud_route_stop.get_route_stops_by_route(db_session, sample_route.id)
    assert result["total"] == 3


__all__ = []
