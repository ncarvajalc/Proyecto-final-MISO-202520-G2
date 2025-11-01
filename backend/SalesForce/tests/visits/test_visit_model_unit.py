"""Unit tests for the visit ORM model."""

from __future__ import annotations

import importlib
from datetime import datetime, timedelta, timezone

import pytest


def _require_visit_model():
    try:
        module = importlib.import_module("app.modules.visits.models")
    except ModuleNotFoundError:  # pragma: no cover - feature not implemented yet
        pytest.skip("Visit model not implemented yet")
    Visit = getattr(module, "Visit", None)
    if Visit is None:
        pytest.skip("Visit model not implemented yet")
    return Visit


@pytest.mark.skip(reason="TODO: restore when Visit.mark_departure is implemented")
def test_mark_departure_updates_field():
    Visit = _require_visit_model()

    visit_time = datetime.now(timezone.utc)
    visit = Visit(
        nombre_institucion="Colegio Central",
        direccion="Calle 123",
        hora=visit_time,
        estado="programada",
        desplazamiento_minutos=15,
        observacion="Primera visita",
    )

    assert getattr(visit, "hora_salida", None) is None

    departure = visit_time + timedelta(hours=2)
    visit.mark_departure(departure)

    assert visit.hora_salida == departure
