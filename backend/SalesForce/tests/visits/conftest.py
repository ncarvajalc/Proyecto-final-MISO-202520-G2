from __future__ import annotations

import importlib
from collections.abc import Callable
from datetime import datetime, timedelta, timezone
from typing import Any

import pytest
from faker import Faker


def _load_visit_schema(name: str):
    """Return a schema from ``app.modules.visits.schemas`` if available."""

    try:
        module = importlib.import_module("app.modules.visits.schemas")
    except ModuleNotFoundError:  # pragma: no cover - feature not implemented yet
        return None

    return getattr(module, name, None)


@pytest.fixture()
def visit_payload_factory(fake: Faker) -> Callable[..., dict[str, Any]]:
    """Return a factory that builds HTTP payloads for visit endpoints."""

    def factory(
        *,
        hours_ahead: int = 1,
        include_departure: bool = True,
        estado: str = "programada",
        overrides: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        visit_time = datetime.now(timezone.utc) + timedelta(hours=hours_ahead)
        payload: dict[str, Any] = {
            "nombre_institucion": fake.company(),
            "direccion": fake.street_address(),
            "hora": visit_time.isoformat(),
            "estado": estado,
            "desplazamiento_minutos": fake.random_int(min=0, max=90),
            "observacion": fake.sentence(),
        }
        if include_departure:
            payload["hora_salida"] = (visit_time + timedelta(hours=1)).isoformat()
        if overrides:
            payload.update(overrides)
        return payload

    return factory


@pytest.fixture()
def visit_create_factory(fake: Faker) -> Callable[..., Any]:
    """Return a factory that builds ``VisitCreate`` payloads for service tests."""

    VisitCreate = _load_visit_schema("VisitCreate")
    if VisitCreate is None:
        pytest.skip("VisitCreate schema not implemented yet")

    def factory(
        *,
        hours_ahead: int = 1,
        include_departure: bool = True,
        estado: str = "programada",
        overrides: dict[str, Any] | None = None,
    ) -> Any:
        visit_time = datetime.now(timezone.utc) + timedelta(hours=hours_ahead)
        data: dict[str, Any] = {
            "nombre_institucion": fake.company(),
            "direccion": fake.street_address(),
            "hora": visit_time,
            "estado": estado,
            "desplazamiento_minutos": fake.random_int(min=0, max=90),
            "observacion": fake.sentence(),
        }
        if include_departure:
            data["hora_salida"] = visit_time + timedelta(hours=1)
        else:
            data["hora_salida"] = None
        if overrides:
            data.update(overrides)
        return VisitCreate(**data)

    return factory
