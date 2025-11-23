"""Unit tests for the visits service layer with multimedia support."""

from __future__ import annotations

import importlib
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest


def _require_service_module():
    try:
        services_pkg = importlib.import_module("app.modules.visits.services")
    except ModuleNotFoundError:  # pragma: no cover
        pytest.skip("Visit service module not implemented yet")
    service_module = getattr(services_pkg, "visit_service", services_pkg)
    if not hasattr(service_module, "create"):
        pytest.skip("Visit service create method not implemented yet")
    return service_module


@pytest.fixture()
def visit_service_module():
    return _require_service_module()


def test_create_visit_with_multimedia_data(monkeypatch, visit_service_module, visit_create_factory, multimedia_files_factory):
    """Test that create service method handles multimedia data."""
    visit_data = visit_create_factory()
    multimedia_data = multimedia_files_factory(count=2)

    now = datetime.now(timezone.utc)

    # Create mock multimedia objects
    multimedia_mocks = [
        SimpleNamespace(
            id=f"media-{idx}",
            visit_id="visit-123",
            file_name=media["file_name"],
            file_type=media["file_type"],
            file_size=media["file_size"],
            created_at=now,
            updated_at=now,
        )
        for idx, media in enumerate(multimedia_data)
    ]

    stored = SimpleNamespace(
        id="visit-123",
        nombre_institucion=visit_data.nombre_institucion,
        direccion=visit_data.direccion,
        hora=visit_data.hora,
        desplazamiento_minutos=visit_data.desplazamiento_minutos,
        hora_salida=visit_data.hora_salida,
        estado=visit_data.estado,
        observacion=visit_data.observacion,
        multimedia=multimedia_mocks,
        created_at=now,
        updated_at=now,
    )

    captured_args = {}

    def fake_create_visit(db, visit, multimedia=None):
        captured_args["visit"] = visit
        captured_args["multimedia"] = multimedia
        return stored

    monkeypatch.setattr(visit_service_module, "create_visit", fake_create_visit)

    result = visit_service_module.create(db=object(), visit=visit_data, multimedia_data=multimedia_data)

    assert result.id == "visit-123"
    assert len(result.multimedia) == 2
    assert captured_args["multimedia"] == multimedia_data
    assert result.multimedia[0].file_name == multimedia_data[0]["file_name"]


def test_create_visit_without_multimedia_data(monkeypatch, visit_service_module, visit_create_factory):
    """Test that create service method works without multimedia data."""
    visit_data = visit_create_factory()
    now = datetime.now(timezone.utc)

    stored = SimpleNamespace(
        id="visit-456",
        nombre_institucion=visit_data.nombre_institucion,
        direccion=visit_data.direccion,
        hora=visit_data.hora,
        desplazamiento_minutos=visit_data.desplazamiento_minutos,
        hora_salida=visit_data.hora_salida,
        estado=visit_data.estado,
        observacion=visit_data.observacion,
        multimedia=[],
        created_at=now,
        updated_at=now,
    )

    captured_args = {}

    def fake_create_visit(db, visit, multimedia=None):
        captured_args["visit"] = visit
        captured_args["multimedia"] = multimedia
        return stored

    monkeypatch.setattr(visit_service_module, "create_visit", fake_create_visit)

    result = visit_service_module.create(db=object(), visit=visit_data)

    assert result.id == "visit-456"
    assert len(result.multimedia) == 0
    assert captured_args["multimedia"] is None
