"""Unit tests for vehicle service layer."""

from __future__ import annotations

import math
from types import SimpleNamespace
from datetime import datetime, UTC

import pytest
from faker import Faker
from fastapi import HTTPException

from app.modules.vehicles.schemas.vehicle import VehicleCreate
from app.modules.vehicles.services import vehicle_service as service


@pytest.fixture()
def sample_payload(fake: Faker):
    """Generate a sample vehicle creation payload."""
    return VehicleCreate(
        placa=fake.unique.bothify(text="???-###"),
        conductor=fake.name(),
        numero_entregas=fake.random_int(min=0, max=20),
    )


class DummyQuery:
    """Mock query object for testing."""

    def __init__(self, result):
        self._result = result

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self._result


class DummySession:
    """Mock session object for testing."""

    def __init__(self, vehicle=None):
        self._vehicle = vehicle

    def query(self, model):
        return DummyQuery(self._vehicle)


def test_create_vehicle_rejects_duplicate_placa(monkeypatch, sample_payload):
    """Test that create rejects vehicles with duplicate placas."""
    db = DummySession()

    # Mock that placa already exists
    monkeypatch.setattr(
        service,
        "get_vehicle_by_placa",
        lambda *args, **kwargs: object(),
    )

    with pytest.raises(HTTPException) as exc_info:
        service.create(db, sample_payload)

    assert exc_info.value.status_code == 409
    assert (
        f"Vehicle with placa '{sample_payload.placa}' already exists"
        in exc_info.value.detail
    )


def test_create_vehicle_returns_valid_schema(
    monkeypatch, sample_payload: VehicleCreate, fake: Faker
):
    """Test that create returns a properly formatted vehicle schema."""
    db = DummySession()

    # Mock that placa doesn't exist
    monkeypatch.setattr(
        service,
        "get_vehicle_by_placa",
        lambda *args, **kwargs: None,
    )

    now = datetime.now(UTC)
    vehicle_id = fake.uuid4()
    created_vehicle = SimpleNamespace(
        id=vehicle_id,
        placa=sample_payload.placa,
        conductor=sample_payload.conductor,
        numero_entregas=sample_payload.numero_entregas,
        created_at=now,
        updated_at=now,
    )

    monkeypatch.setattr(
        service,
        "create_vehicle",
        lambda *args, **kwargs: created_vehicle,
    )

    result = service.create(db, sample_payload)

    assert result["id"] == vehicle_id
    assert result["placa"] == sample_payload.placa
    assert result["conductor"] == sample_payload.conductor
    assert result["numeroEntregas"] == sample_payload.numero_entregas
    assert result["created_at"] == now
    assert result["updated_at"] == now


def test_read_vehicles_validates_pagination_arguments():
    """Test that read validates pagination parameters."""
    db = object()

    with pytest.raises(HTTPException) as exc_info:
        service.read(db, page=0, limit=5)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "page and limit must be greater than zero"

    with pytest.raises(HTTPException) as exc_info:
        service.read(db, page=1, limit=-1)

    assert exc_info.value.status_code == 400


def test_read_vehicles_maps_orm_objects(monkeypatch, fake: Faker):
    """Test that read properly maps ORM objects to response schemas."""
    db = object()
    now = datetime.now(UTC)

    sample_vehicles = [
        SimpleNamespace(
            id=fake.uuid4(),
            placa=fake.unique.bothify(text="???-###"),
            conductor=fake.name(),
            numero_entregas=fake.random_int(min=0, max=20),
            created_at=now,
            updated_at=now,
        ),
        SimpleNamespace(
            id=fake.uuid4(),
            placa=fake.unique.bothify(text="???-###"),
            conductor=fake.name(),
            numero_entregas=fake.random_int(min=0, max=20),
            created_at=now,
            updated_at=now,
        ),
    ]

    total_count = fake.random_int(min=3, max=10)

    monkeypatch.setattr(
        service,
        "get_vehicles_all",
        lambda *args, **kwargs: {"vehicles": sample_vehicles, "total": total_count},
    )

    result = service.read(db, page=2, limit=2)

    assert result["total"] == total_count
    assert result["page"] == 2
    assert result["limit"] == 2
    expected_total_pages = math.ceil(total_count / 2)
    assert result["total_pages"] == expected_total_pages

    assert len(result["data"]) == 2
    assert result["data"][0]["numeroEntregas"] == sample_vehicles[0].numero_entregas
    assert result["data"][1]["placa"] == sample_vehicles[1].placa


def test_read_vehicles_handles_empty_results(monkeypatch):
    """Test that read handles empty vehicle list."""
    db = object()

    monkeypatch.setattr(
        service,
        "get_vehicles_all",
        lambda *args, **kwargs: {"vehicles": [], "total": 0},
    )

    result = service.read(db, page=1, limit=10)

    assert result["total"] == 0
    assert result["total_pages"] == 0
    assert len(result["data"]) == 0


__all__ = []
