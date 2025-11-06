"""Integration tests for Visit CRUD operations with multimedia."""

from __future__ import annotations

import importlib

import pytest


def _require_crud_module():
    try:
        crud_module = importlib.import_module("app.modules.visits.crud")
    except ModuleNotFoundError:  # pragma: no cover - feature not implemented yet
        pytest.skip("Visit CRUD module not implemented yet")

    if not hasattr(crud_module, "create_visit"):
        pytest.skip("create_visit not implemented yet")

    return crud_module


def _require_models():
    try:
        models = importlib.import_module("app.modules.visits.models")
    except ModuleNotFoundError:  # pragma: no cover
        pytest.skip("Visit models not implemented yet")

    Visit = getattr(models, "Visit", None)
    VisitMultimedia = getattr(models, "VisitMultimedia", None)

    if Visit is None or VisitMultimedia is None:
        pytest.skip("Visit or VisitMultimedia models not implemented yet")

    return Visit, VisitMultimedia


def test_create_visit_without_multimedia(db_session, visit_create_factory):
    """Test creating a visit without multimedia files."""
    crud = _require_crud_module()
    Visit, _ = _require_models()

    visit_data = visit_create_factory()
    created_visit = crud.create_visit(db_session, visit_data)

    assert created_visit.id is not None
    assert created_visit.nombre_institucion == visit_data.nombre_institucion
    assert len(created_visit.multimedia) == 0


def test_create_visit_with_single_multimedia(db_session, visit_create_factory, multimedia_files_factory):
    """Test creating a visit with a single multimedia file."""
    crud = _require_crud_module()
    Visit, VisitMultimedia = _require_models()

    visit_data = visit_create_factory()
    multimedia_data = multimedia_files_factory(count=1)

    created_visit = crud.create_visit(db_session, visit_data, multimedia_data)

    assert created_visit.id is not None
    assert len(created_visit.multimedia) == 1

    multimedia = created_visit.multimedia[0]
    assert multimedia.visit_id == created_visit.id
    assert multimedia.file_name == multimedia_data[0]["file_name"]
    assert multimedia.file_type == multimedia_data[0]["file_type"]
    assert multimedia.file_size == multimedia_data[0]["file_size"]
    assert multimedia.file_data == multimedia_data[0]["file_data"]


def test_create_visit_with_multiple_multimedia(db_session, visit_create_factory, multimedia_files_factory):
    """Test creating a visit with multiple multimedia files."""
    crud = _require_crud_module()
    Visit, VisitMultimedia = _require_models()

    visit_data = visit_create_factory()
    multimedia_data = multimedia_files_factory(count=3)

    created_visit = crud.create_visit(db_session, visit_data, multimedia_data)

    assert created_visit.id is not None
    assert len(created_visit.multimedia) == 3

    # Verify all multimedia files were created
    for idx, multimedia in enumerate(created_visit.multimedia):
        assert multimedia.visit_id == created_visit.id
        assert multimedia.file_name == multimedia_data[idx]["file_name"]
        assert multimedia.file_type == multimedia_data[idx]["file_type"]
        assert multimedia.file_size == multimedia_data[idx]["file_size"]


def test_multimedia_cascade_delete(db_session, visit_create_factory, multimedia_files_factory):
    """Test that deleting a visit also deletes associated multimedia."""
    crud = _require_crud_module()
    Visit, VisitMultimedia = _require_models()

    visit_data = visit_create_factory()
    multimedia_data = multimedia_files_factory(count=2)

    created_visit = crud.create_visit(db_session, visit_data, multimedia_data)
    visit_id = created_visit.id

    # Verify multimedia exists
    multimedia_count = db_session.query(VisitMultimedia).filter(
        VisitMultimedia.visit_id == visit_id
    ).count()
    assert multimedia_count == 2

    # Delete the visit
    db_session.delete(created_visit)
    db_session.commit()

    # Verify multimedia was also deleted (cascade)
    multimedia_count_after = db_session.query(VisitMultimedia).filter(
        VisitMultimedia.visit_id == visit_id
    ).count()
    assert multimedia_count_after == 0


def test_list_visits_includes_multimedia(db_session, visit_create_factory, multimedia_files_factory):
    """Test that listing visits includes multimedia relationship."""
    crud = _require_crud_module()

    # Create a visit with multimedia
    visit_data = visit_create_factory()
    multimedia_data = multimedia_files_factory(count=2)
    crud.create_visit(db_session, visit_data, multimedia_data)

    # List visits
    result = crud.list_visits_paginated(db_session, skip=0, limit=10)

    assert result["total"] >= 1
    assert len(result["items"]) >= 1

    # Check the first visit has multimedia loaded
    first_visit = result["items"][0]
    assert hasattr(first_visit, "multimedia")
    assert len(first_visit.multimedia) == 2
