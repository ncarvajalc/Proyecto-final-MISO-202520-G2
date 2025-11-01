"""Integration tests for vehicle service layer."""

from __future__ import annotations

import math

import pytest
from faker import Faker
from fastapi import HTTPException

from app.modules.vehicles.schemas.vehicle import VehicleCreate
from app.modules.vehicles.services import vehicle_service as service
from app.modules.vehicles.models.vehicle import Vehicle


def test_create_vehicle_persists_and_maps_response(db_session, fake: Faker):
    """Test that create persists a vehicle and returns proper response."""
    placa = fake.unique.bothify(text="???-###")
    conductor = fake.name()
    numero_entregas = fake.random_int(min=0, max=20)

    payload = VehicleCreate(
        placa=placa,
        conductor=conductor,
        numero_entregas=numero_entregas,
    )

    created = service.create(db_session, payload)

    assert created["id"] is not None
    assert created["placa"] == placa
    assert created["conductor"] == conductor
    assert created["numeroEntregas"] == numero_entregas
    assert created["created_at"] is not None
    assert created["updated_at"] is not None

    # Verify persistence in database
    stored = db_session.query(Vehicle).filter_by(placa=placa).first()
    assert stored is not None
    assert stored.placa == placa
    assert stored.conductor == conductor
    assert stored.numero_entregas == numero_entregas


def test_create_vehicle_prevents_duplicate_placa(db_session, fake: Faker):
    """Test that create prevents duplicate license plates."""
    placa = fake.unique.bothify(text="???-###")
    base_payload = VehicleCreate(
        placa=placa,
        conductor=fake.name(),
        numero_entregas=fake.random_int(min=0, max=20),
    )

    # Create first vehicle
    first = service.create(db_session, base_payload)
    assert first["id"] is not None

    # Try to create duplicate
    with pytest.raises(HTTPException) as exc_info:
        service.create(db_session, base_payload)

    assert exc_info.value.status_code == 409
    assert f"Vehicle with placa '{placa}' already exists" in exc_info.value.detail


def test_read_vehicles_returns_paginated_response(db_session, fake: Faker):
    """Test that read returns properly paginated vehicle list."""
    # Get baseline
    baseline_total = service.read(db_session, page=1, limit=1)["total"]

    # Create 3 vehicles
    for _ in range(3):
        payload = VehicleCreate(
            placa=fake.unique.bothify(text="???-###"),
            conductor=fake.name(),
            numero_entregas=fake.random_int(min=0, max=20),
        )
        service.create(db_session, payload)

    # Test first page
    first_page = service.read(db_session, page=1, limit=2)
    expected_total = baseline_total + 3
    expected_pages = math.ceil(expected_total / 2)

    assert first_page["total"] == expected_total
    assert first_page["total_pages"] == expected_pages
    assert first_page["page"] == 1
    assert first_page["limit"] == 2
    assert len(first_page["data"]) == min(2, expected_total)

    # Verify all vehicles have required fields
    for vehicle in first_page["data"]:
        assert "id" in vehicle
        assert "placa" in vehicle
        assert "conductor" in vehicle
        assert "numeroEntregas" in vehicle
        assert "created_at" in vehicle
        assert "updated_at" in vehicle

    # Verify database persistence
    stored_count = db_session.query(Vehicle).count()
    assert stored_count == expected_total

    # Test second page
    second_page = service.read(db_session, page=2, limit=2)
    assert second_page["page"] == 2
    assert 0 < len(second_page["data"]) <= 2


def test_read_vehicles_handles_different_page_sizes(db_session, fake: Faker):
    """Test that read handles different page sizes correctly."""
    # Create 5 vehicles
    for _ in range(5):
        payload = VehicleCreate(
            placa=fake.unique.bothify(text="???-###"),
            conductor=fake.name(),
            numero_entregas=fake.random_int(min=0, max=20),
        )
        service.create(db_session, payload)

    # Test with limit=1
    result = service.read(db_session, page=1, limit=1)
    assert len(result["data"]) == 1
    assert result["total_pages"] == 5

    # Test with limit=3
    result = service.read(db_session, page=1, limit=3)
    assert len(result["data"]) == 3
    assert result["total_pages"] == math.ceil(5 / 3)

    # Test with limit=10 (more than total)
    result = service.read(db_session, page=1, limit=10)
    assert len(result["data"]) == 5
    assert result["total_pages"] == 1


__all__ = []
