"""Unit tests for the visits service layer."""

from __future__ import annotations

import importlib
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException


def _require_service_module():
    try:
        services_pkg = importlib.import_module("app.modules.visits.services")
    except ModuleNotFoundError:  # pragma: no cover - feature not implemented yet
        pytest.skip("Visit service module not implemented yet")
    service_module = getattr(services_pkg, "visit_service", services_pkg)
    missing = [
        name
        for name in ("create", "list_client_visits", "retrieve", "mark_departure")
        if not hasattr(service_module, name)
    ]
    if missing:
        pytest.skip("Visit service API not implemented yet")
    return service_module


def _normalize(dt: datetime) -> datetime:
    return dt.replace(tzinfo=None) if dt.tzinfo else dt


@pytest.fixture()
def visit_service_module():
    return _require_service_module()


@pytest.fixture()
def sample_payload(visit_create_factory):
    return visit_create_factory(hours_ahead=24, overrides={"desplazamiento_minutos": 30})


def test_create_visit_rejects_departure_before_visit_time(
    visit_service_module, visit_create_factory
):
    payload = visit_create_factory(include_departure=False)
    payload.hora_salida = payload.hora - timedelta(minutes=5)

    with pytest.raises(HTTPException) as exc:
        visit_service_module.create(db=object(), payload=payload)

    assert exc.value.status_code == 400



def test_create_visit_returns_schema(monkeypatch, visit_service_module, sample_payload):
    now = datetime.now(timezone.utc)
    stored = SimpleNamespace(
        id="visit-123",
        nombre_institucion=sample_payload.nombre_institucion,
        direccion=sample_payload.direccion,
        hora=sample_payload.hora,
        desplazamiento_minutos=sample_payload.desplazamiento_minutos,
        hora_salida=sample_payload.hora_salida,
        estado=sample_payload.estado,
        observacion=sample_payload.observacion,
        created_at=now,
        updated_at=now,
    )

    captured_payload: dict[str, object] = {}

    def fake_create_visit(db, payload):
        captured_payload["payload"] = payload
        return stored

    monkeypatch.setattr(visit_service_module, "create_visit", fake_create_visit)

    result = visit_service_module.create(db=object(), payload=sample_payload)

    assert result.id == "visit-123"
    assert result.nombre_institucion == sample_payload.nombre_institucion
    normalized_payload = captured_payload["payload"].hora
    assert normalized_payload == _normalize(sample_payload.hora)



def test_list_client_visits_validates_pagination(visit_service_module):
    with pytest.raises(HTTPException) as exc:
        visit_service_module.list_client_visits(db=object(), page=0, limit=5)

    assert exc.value.status_code == 400



def test_list_client_visits_maps_results(monkeypatch, visit_service_module, fake):
    now = datetime.now(timezone.utc)
    sample_items = [
        SimpleNamespace(
            id=fake.uuid4(),
            nombre_institucion=fake.company(),
            direccion=fake.address(),
            hora=now + timedelta(hours=idx),
            desplazamiento_minutos=idx * 5,
            hora_salida=None,
            estado="programada",
            observacion=None,
            created_at=now,
            updated_at=now,
        )
        for idx in range(2)
    ]

    monkeypatch.setattr(
        visit_service_module,
        "list_visits",
        lambda *args, **kwargs: {"items": sample_items, "total": len(sample_items)},
    )

    result = visit_service_module.list_client_visits(db=object(), page=1, limit=10)

    assert result.total == len(sample_items)
    assert len(result.data) == 2
    assert result.data[1].desplazamiento_minutos == 5



def test_retrieve_returns_visit(monkeypatch, visit_service_module, sample_payload):
    stored = SimpleNamespace(
        id="visit-999",
        nombre_institucion=sample_payload.nombre_institucion,
        direccion=sample_payload.direccion,
        hora=sample_payload.hora,
        desplazamiento_minutos=sample_payload.desplazamiento_minutos,
        hora_salida=sample_payload.hora_salida,
        estado=sample_payload.estado,
        observacion=sample_payload.observacion,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    monkeypatch.setattr(visit_service_module, "get_visit", lambda *args, **kwargs: stored)

    result = visit_service_module.retrieve(db=object(), visit_id="visit-999")

    assert result.id == "visit-999"



def test_retrieve_raises_for_missing_visit(monkeypatch, visit_service_module):
    monkeypatch.setattr(visit_service_module, "get_visit", lambda *args, **kwargs: None)

    with pytest.raises(HTTPException) as exc:
        visit_service_module.retrieve(db=object(), visit_id="missing")

    assert exc.value.status_code == 404



class DummySession:
    def __init__(self):
        self.add_called = False
        self.refresh_called = False

    def add(self, obj):
        self.add_called = True

    def commit(self):  # pragma: no cover - provided for compatibility
        pass

    def refresh(self, obj):
        self.refresh_called = True


class DummyVisit:
    def __init__(self, sample):
        self.id = "visit-1"
        self.nombre_institucion = sample.nombre_institucion
        self.direccion = sample.direccion
        self.hora = _normalize(sample.hora)
        self.desplazamiento_minutos = sample.desplazamiento_minutos
        self.hora_salida = None
        self.estado = sample.estado
        self.observacion = sample.observacion
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        self.created_at = now
        self.updated_at = now

    def mark_departure(self, departure_time):
        self.hora_salida = _normalize(departure_time)
        self.updated_at = self.hora_salida



def test_mark_departure_updates_visit(monkeypatch, visit_service_module, sample_payload):
    visit_obj = DummyVisit(sample_payload)

    monkeypatch.setattr(visit_service_module, "get_visit", lambda *args, **kwargs: visit_obj)

    session = DummySession()
    departure = sample_payload.hora + timedelta(hours=2)

    result = visit_service_module.mark_departure(session, "visit-1", departure)

    assert result.hora_salida == _normalize(departure)
    assert session.add_called is True
    assert session.refresh_called is True



def test_mark_departure_rejects_invalid_departure(
    monkeypatch, visit_service_module, sample_payload
):
    visit_obj = SimpleNamespace(
        id="visit-1",
        hora=sample_payload.hora,
        hora_salida=None,
        mark_departure=lambda departure_time: None,
    )

    monkeypatch.setattr(visit_service_module, "get_visit", lambda *args, **kwargs: visit_obj)

    with pytest.raises(HTTPException) as exc:
        visit_service_module.mark_departure(
            object(), "visit-1", sample_payload.hora - timedelta(minutes=1)
        )

    assert exc.value.status_code == 400



def test_mark_departure_raises_for_missing_visit(monkeypatch, visit_service_module):
    monkeypatch.setattr(visit_service_module, "get_visit", lambda *args, **kwargs: None)

    with pytest.raises(HTTPException) as exc:
        visit_service_module.mark_departure(object(), "unknown", datetime.now(timezone.utc))

    assert exc.value.status_code == 404
