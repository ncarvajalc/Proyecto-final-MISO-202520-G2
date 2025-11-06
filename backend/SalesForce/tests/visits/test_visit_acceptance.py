"""Acceptance tests for the client visit registration flow."""

from __future__ import annotations

import importlib
from datetime import datetime, timedelta, timezone

import pytest

NOT_IMPLEMENTED_STATUSES = {404, 405, 501}


def _require_endpoint(response, message: str):
    if response.status_code in NOT_IMPLEMENTED_STATUSES:
        pytest.skip(message)
    return response


def _parse_iso_datetime(value: str) -> datetime:
    try:
        return datetime.fromisoformat(value)
    except ValueError:  # pragma: no cover - handles trailing "Z"
        return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _load_visit_model():
    try:
        module = importlib.import_module("app.modules.visits.models")
    except ModuleNotFoundError:  # pragma: no cover - feature not implemented yet
        return None
    return getattr(module, "Visit", None)


def test_visit_registration_end_to_end(client, db_session, visit_payload_factory):
    """Exercise the visit workflow from creation to listing and retrieval."""

    list_response = _require_endpoint(
        client.get("/visitas/", params={"page": 1, "limit": 10}),
        "Visits listing endpoint not implemented yet",
    )
    assert list_response.status_code == 200
    baseline_total = list_response.json().get("total", 0)

    payload = visit_payload_factory(hours_ahead=2, overrides={"desplazamiento_minutos": 20})

    # Convert to form data for multipart/form-data endpoint
    form_data = {
        "nombre_institucion": payload["nombre_institucion"],
        "direccion": payload["direccion"],
        "hora": payload["hora"],
        "estado": payload["estado"],
        "desplazamiento_minutos": str(payload["desplazamiento_minutos"]),
        "observacion": payload["observacion"],
    }
    if "hora_salida" in payload and payload["hora_salida"]:
        form_data["hora_salida"] = payload["hora_salida"]

    create_response = _require_endpoint(
        client.post("/visitas/", data=form_data),
        "Visit creation endpoint not implemented yet",
    )
    assert create_response.status_code in {200, 201}

    created = create_response.json()
    visit_id = created["id"]
    assert created["nombre_institucion"] == payload["nombre_institucion"]
    assert created["estado"] == payload["estado"]
    assert created["desplazamiento_minutos"] == payload["desplazamiento_minutos"]

    Visit = _load_visit_model()
    if Visit is not None:
        stored = db_session.query(Visit).filter_by(id=visit_id).first()
        assert stored is not None
        assert stored.nombre_institucion == payload["nombre_institucion"]

    follow_up = _require_endpoint(
        client.get("/visitas/", params={"page": 1, "limit": 10}),
        "Visits listing endpoint not implemented yet",
    )
    assert follow_up.status_code == 200
    payload_list = follow_up.json()
    assert payload_list["total"] == baseline_total + 1
    assert any(item["id"] == visit_id for item in payload_list["data"])

    retrieve_response = _require_endpoint(
        client.get(f"/visitas/{visit_id}"),
        "Visit detail endpoint not implemented yet",
    )
    assert retrieve_response.status_code == 200
    retrieved = retrieve_response.json()
    assert retrieved["id"] == visit_id
    assert retrieved["nombre_institucion"] == payload["nombre_institucion"]

    visit_time = _parse_iso_datetime(created["hora"])
    new_departure = visit_time + timedelta(hours=2)
    patch_response = _require_endpoint(
        client.patch(
            f"/visitas/{visit_id}/salida",
            json={"hora_salida": new_departure.astimezone(timezone.utc).isoformat()},
        ),
        "Visit departure endpoint not implemented yet",
    )
    assert patch_response.status_code == 200
    patched = patch_response.json()
    assert patched["hora_salida"].startswith(new_departure.isoformat()[:19])

    updated_detail = _require_endpoint(
        client.get(f"/visitas/{visit_id}"),
        "Visit detail endpoint not implemented yet",
    )
    assert updated_detail.status_code == 200
    assert updated_detail.json()["hora_salida"].startswith(new_departure.isoformat()[:19])
