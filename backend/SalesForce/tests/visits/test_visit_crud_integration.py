"""Integration tests for the visits CRUD helpers."""

from __future__ import annotations

import importlib

import pytest


def _require_crud_module():
    try:
        module = importlib.import_module("app.modules.visits.crud")
    except ModuleNotFoundError:  # pragma: no cover - feature not implemented yet
        pytest.skip("Visit CRUD module not implemented yet")
    missing = [
        name
        for name in ("create_visit", "get_visit", "list_visits")
        if not hasattr(module, name)
    ]
    if missing:
        pytest.skip("Visit CRUD helpers not implemented yet")
    return module


def _require_visit_model():
    try:
        module = importlib.import_module("app.modules.visits.models")
    except ModuleNotFoundError:  # pragma: no cover - feature not implemented yet
        pytest.skip("Visit model not implemented yet")
    Visit = getattr(module, "Visit", None)
    if Visit is None:
        pytest.skip("Visit model not implemented yet")
    return Visit


def test_create_visit_persists_record(db_session, visit_create_factory):
    crud = _require_crud_module()
    Visit = _require_visit_model()

    payload = visit_create_factory()

    stored = crud.create_visit(db_session, payload)

    assert getattr(stored, "id", None) is not None
    fetched = db_session.query(Visit).filter_by(id=stored.id).first()
    assert fetched is not None
    assert fetched.nombre_institucion == payload.nombre_institucion
    assert fetched.estado == payload.estado


def test_list_visits_orders_by_datetime(db_session, visit_create_factory):
    crud = _require_crud_module()

    later = visit_create_factory(hours_ahead=4)
    earlier = visit_create_factory(hours_ahead=1)

    later_visit = crud.create_visit(db_session, later)
    earlier_visit = crud.create_visit(db_session, earlier)

    result = crud.list_visits(db_session, skip=0, limit=10)

    assert result["total"] == 2
    ordered_ids = [item.id for item in result["items"]]
    assert ordered_ids == [earlier_visit.id, later_visit.id]


def test_get_visit_returns_none_for_missing_record(db_session):
    crud = _require_crud_module()

    assert crud.get_visit(db_session, "non-existent") is None
