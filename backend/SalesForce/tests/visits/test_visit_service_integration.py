"""Integration tests for visits service interacting with the database."""

from __future__ import annotations

import importlib
from datetime import datetime, timedelta, timezone

import pytest


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


def _require_visit_model():
    try:
        module = importlib.import_module("app.modules.visits.models")
    except ModuleNotFoundError:  # pragma: no cover - feature not implemented yet
        pytest.skip("Visit model not implemented yet")
    Visit = getattr(module, "Visit", None)
    if Visit is None:
        pytest.skip("Visit model not implemented yet")
    return Visit


def _normalize(dt: datetime) -> datetime:
    if dt.tzinfo:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


@pytest.fixture()
def visit_service_module():
    return _require_service_module()


@pytest.fixture()
def visit_model():
    return _require_visit_model()



def test_create_visit_persists_and_returns_schema(
    db_session, visit_create_factory, visit_service_module, visit_model
):
    payload = visit_create_factory()

    result = visit_service_module.create(db_session, payload)

    assert getattr(result, "id", None) is not None
    stored = db_session.query(visit_model).filter_by(id=result.id).first()
    assert stored is not None
    assert stored.nombre_institucion == payload.nombre_institucion
    assert stored.estado == payload.estado



def test_list_client_visits_returns_paginated_data(
    db_session, visit_create_factory, visit_service_module
):
    baseline = visit_service_module.list_client_visits(db_session).total

    for idx in range(3):
        payload = visit_create_factory(hours_ahead=idx + 1)
        visit_service_module.create(db_session, payload)

    paginated = visit_service_module.list_client_visits(db_session, page=1, limit=2)

    assert paginated.total == baseline + 3
    assert paginated.page == 1
    assert paginated.limit == 2
    assert paginated.total_pages >= 2
    assert len(paginated.data) == min(2, paginated.total)



def test_retrieve_visit_returns_existing_record(
    db_session, visit_create_factory, visit_service_module
):
    payload = visit_create_factory()
    created = visit_service_module.create(db_session, payload)

    retrieved = visit_service_module.retrieve(db_session, created.id)

    assert retrieved.id == created.id
    assert retrieved.nombre_institucion == payload.nombre_institucion



def test_mark_departure_updates_record(
    db_session, visit_create_factory, visit_service_module, visit_model
):
    payload = visit_create_factory()
    created = visit_service_module.create(db_session, payload)

    new_departure = payload.hora + timedelta(hours=2)
    updated = visit_service_module.mark_departure(db_session, created.id, new_departure)

    assert _normalize(updated.hora_salida) == _normalize(new_departure)
    stored = db_session.query(visit_model).filter_by(id=created.id).first()
    assert _normalize(stored.hora_salida) == _normalize(new_departure)
