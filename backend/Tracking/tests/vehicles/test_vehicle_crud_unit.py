"""Unit tests for vehicle CRUD operations."""

from __future__ import annotations

import pytest
from faker import Faker

from app.modules.vehicles.crud import crud_vehicle
from app.modules.vehicles.models.vehicle import Vehicle
from app.modules.vehicles.schemas.vehicle import VehicleCreate


def test_create_vehicle_persists_to_database(db_session, fake: Faker):
    """Test that create_vehicle persists a new vehicle to the database."""
    placa = fake.unique.bothify(text="???-###")
    conductor = fake.name()
    numero_entregas = fake.random_int(min=0, max=20)

    vehicle_data = VehicleCreate(
        placa=placa,
        conductor=conductor,
        numero_entregas=numero_entregas,
    )

    created = crud_vehicle.create_vehicle(db_session, vehicle_data)

    assert created.id is not None
    assert created.placa == placa
    assert created.conductor == conductor
    assert created.numero_entregas == numero_entregas
    assert created.created_at is not None
    assert created.updated_at is not None

    # Verify in database
    stored = db_session.query(Vehicle).filter_by(placa=placa).first()
    assert stored is not None
    assert stored.id == created.id
    assert stored.placa == placa


def test_get_vehicle_returns_vehicle_by_id(db_session, fake: Faker):
    """Test that get_vehicle retrieves a vehicle by ID."""
    vehicle = Vehicle(
        placa=fake.unique.bothify(text="???-###"),
        conductor=fake.name(),
        numero_entregas=fake.random_int(min=0, max=20),
    )
    db_session.add(vehicle)
    db_session.commit()

    retrieved = crud_vehicle.get_vehicle(db_session, vehicle.id)

    assert retrieved is not None
    assert retrieved.id == vehicle.id
    assert retrieved.placa == vehicle.placa
    assert retrieved.conductor == vehicle.conductor


def test_get_vehicle_returns_none_when_not_found(db_session):
    """Test that get_vehicle returns None for non-existent ID."""
    retrieved = crud_vehicle.get_vehicle(db_session, "non-existent-id")

    assert retrieved is None


def test_get_vehicle_by_placa_returns_vehicle(db_session, fake: Faker):
    """Test that get_vehicle_by_placa retrieves a vehicle by license plate."""
    placa = fake.unique.bothify(text="???-###")
    vehicle = Vehicle(
        placa=placa,
        conductor=fake.name(),
        numero_entregas=fake.random_int(min=0, max=20),
    )
    db_session.add(vehicle)
    db_session.commit()

    retrieved = crud_vehicle.get_vehicle_by_placa(db_session, placa)

    assert retrieved is not None
    assert retrieved.placa == placa
    assert retrieved.id == vehicle.id


def test_get_vehicle_by_placa_returns_none_when_not_found(db_session):
    """Test that get_vehicle_by_placa returns None for non-existent placa."""
    retrieved = crud_vehicle.get_vehicle_by_placa(db_session, "XXX-999")

    assert retrieved is None


def test_get_vehicles_all_returns_paginated_results(db_session, fake: Faker):
    """Test that get_vehicles_all returns paginated list of vehicles."""
    # Create 5 vehicles
    for _ in range(5):
        vehicle = Vehicle(
            placa=fake.unique.bothify(text="???-###"),
            conductor=fake.name(),
            numero_entregas=fake.random_int(min=0, max=20),
        )
        db_session.add(vehicle)
    db_session.commit()

    # Get first 3
    result = crud_vehicle.get_vehicles_all(db_session, skip=0, limit=3)

    assert result["total"] == 5
    assert len(result["vehicles"]) == 3

    # Get next 2
    result = crud_vehicle.get_vehicles_all(db_session, skip=3, limit=3)

    assert result["total"] == 5
    assert len(result["vehicles"]) == 2


def test_get_vehicles_all_returns_empty_when_no_vehicles(db_session):
    """Test that get_vehicles_all returns empty list when no vehicles exist."""
    result = crud_vehicle.get_vehicles_all(db_session, skip=0, limit=10)

    assert result["total"] == 0
    assert len(result["vehicles"]) == 0


__all__ = []
