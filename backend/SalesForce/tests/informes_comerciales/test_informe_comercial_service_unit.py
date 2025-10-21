"""Unit tests for Informe Comercial service layer."""

import math
from datetime import UTC, datetime
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from faker import Faker

from app.modules.reports.schemas import InformeComercialCreate
from app.modules.reports.services import informe_comercial_service as service


@pytest.fixture()
def sample_payload(fake: Faker):
    """Create sample InformeComercialCreate payload."""
    return InformeComercialCreate(
        nombre=fake.catch_phrase(),
    )


def test_create_informe_returns_valid_schema(monkeypatch, sample_payload, fake: Faker):
    """Test that create service returns a valid response schema."""
    db = object()

    now = datetime.now(UTC)
    informe_id = fake.uuid4()
    ventas_totales = float(
        round(fake.pyfloat(min_value=0, max_value=100000, right_digits=2), 2)
    )
    unidades_vendidas = float(
        round(fake.pyfloat(min_value=0, max_value=1000, right_digits=2), 2)
    )

    created_informe = SimpleNamespace(
        id=informe_id,
        nombre=sample_payload.nombre,
        fecha=now,
        ventas_totales=ventas_totales,
        unidades_vendidas=unidades_vendidas,
        created_at=now,
        updated_at=now,
    )

    monkeypatch.setattr(
        service, "create_informe_comercial", lambda *args, **kwargs: created_informe
    )

    result = service.create(db, sample_payload)

    assert result.id == informe_id
    assert result.nombre == sample_payload.nombre
    payload = result.model_dump(by_alias=True)
    assert payload["ventasTotales"] == ventas_totales
    assert payload["unidadesVendidas"] == unidades_vendidas
    assert "fecha" in payload


def test_list_informes_validates_pagination_arguments():
    """Test that list service validates pagination parameters."""
    db = object()

    # Test page < 1
    with pytest.raises(HTTPException) as exc_info:
        service.list_informes_comerciales(db, page=0, limit=5)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "page and limit must be greater than zero"

    # Test limit < 1
    with pytest.raises(HTTPException) as exc_info:
        service.list_informes_comerciales(db, page=1, limit=0)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "page and limit must be greater than zero"


def test_list_informes_maps_orm_objects(monkeypatch, fake: Faker):
    """Test that list service correctly maps ORM objects to schemas."""
    db = object()
    now = datetime.now(UTC)

    # Create sample items
    sample_items = [
        SimpleNamespace(
            id=fake.uuid4(),
            nombre=fake.catch_phrase(),
            fecha=now,
            ventas_totales=float(
                round(fake.pyfloat(min_value=0, max_value=50000, right_digits=2), 2)
            ),
            unidades_vendidas=float(
                round(fake.pyfloat(min_value=0, max_value=500, right_digits=2), 2)
            ),
        ),
        SimpleNamespace(
            id=fake.uuid4(),
            nombre=fake.catch_phrase(),
            fecha=now,
            ventas_totales=float(
                round(fake.pyfloat(min_value=0, max_value=50000, right_digits=2), 2)
            ),
            unidades_vendidas=float(
                round(fake.pyfloat(min_value=0, max_value=500, right_digits=2), 2)
            ),
        ),
    ]

    total_count = fake.random_int(min=3, max=10)

    monkeypatch.setattr(
        service,
        "list_informes_comerciales_paginated",
        lambda *args, **kwargs: {"items": sample_items, "total": total_count},
    )

    result = service.list_informes_comerciales(db, page=2, limit=2)

    assert result.total == total_count
    assert result.page == 2
    assert result.limit == 2
    expected_total_pages = math.ceil(total_count / 2)
    assert result.total_pages == expected_total_pages

    payload = result.model_dump(by_alias=True)
    assert payload["total_pages"] == expected_total_pages
    assert len(payload["data"]) == 2
    assert all("ventasTotales" in item for item in payload["data"])
    assert all("unidadesVendidas" in item for item in payload["data"])


def test_list_informes_handles_empty_result(monkeypatch):
    """Test that list service handles empty results correctly."""
    db = object()

    monkeypatch.setattr(
        service,
        "list_informes_comerciales_paginated",
        lambda *args, **kwargs: {"items": [], "total": 0},
    )

    result = service.list_informes_comerciales(db, page=1, limit=10)

    assert result.total == 0
    assert result.total_pages == 0
    assert len(result.data) == 0
