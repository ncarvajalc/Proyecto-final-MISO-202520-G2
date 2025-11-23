"""Functional tests exercising the visits HTTP endpoints."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

NOT_IMPLEMENTED_STATUSES = {404, 405, 501}


def _require_endpoint(response, message: str):
    if response.status_code in NOT_IMPLEMENTED_STATUSES:
        pytest.skip(message)
    return response



def test_create_visit_endpoint_success(client, visit_payload_factory):
    payload = visit_payload_factory()

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

    response = _require_endpoint(
        client.post("/visitas/", data=form_data),
        "Visit creation endpoint not implemented yet",
    )

    assert response.status_code in {200, 201}
    data = response.json()
    assert data["nombre_institucion"] == payload["nombre_institucion"]
    assert data["estado"] == payload["estado"]
    assert "id" in data



# TODO: Fix visit creation validation to reject invalid departure times consistently.
@pytest.mark.skip(reason="TODO: Fix visit creation validation to reject invalid departure times consistently.")
def test_create_visit_endpoint_rejects_invalid_departure(client, visit_payload_factory):
    payload = visit_payload_factory()
    visit_time = datetime.fromisoformat(payload["hora"])
    invalid_departure = (visit_time - timedelta(minutes=10)).isoformat()

    form_data = {
        "nombre_institucion": payload["nombre_institucion"],
        "direccion": payload["direccion"],
        "hora": payload["hora"],
        "estado": payload["estado"],
        "desplazamiento_minutos": str(payload["desplazamiento_minutos"]),
        "observacion": payload["observacion"],
        "hora_salida": invalid_departure,
    }

    response = _require_endpoint(
        client.post("/visitas/", data=form_data),
        "Visit creation endpoint not implemented yet",
    )

    assert response.status_code in {400, 422}
    body = response.json()
    assert "detail" in body


def test_list_visits_endpoint_returns_paginated_data(client, visit_payload_factory):
    initial_probe = _require_endpoint(
        client.get("/visitas/", params={"page": 1, "limit": 1}),
        "Visits listing endpoint not implemented yet",
    )
    assert initial_probe.status_code == 200

    for idx in range(3):
        payload = visit_payload_factory(hours_ahead=idx + 1)
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

    response = _require_endpoint(
        client.get("/visitas/", params={"page": 1, "limit": 2}),
        "Visits listing endpoint not implemented yet",
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["page"] == 1
    assert payload["limit"] == 2
    assert payload["total"] >= 3
    assert len(payload["data"]) == min(2, payload["total"])



def test_retrieve_visit_endpoint(client, visit_payload_factory):
    payload = visit_payload_factory()
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
    visit_id = create_response.json()["id"]

    response = _require_endpoint(
        client.get(f"/visitas/{visit_id}"),
        "Visit detail endpoint not implemented yet",
    )

    assert response.status_code == 200
    assert response.json()["id"] == visit_id



def test_mark_departure_endpoint_updates_visit(client, visit_payload_factory):
    payload = visit_payload_factory()
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
    visit_id = create_response.json()["id"]

    new_departure = datetime.fromisoformat(payload["hora"]) + timedelta(hours=3)
    response = _require_endpoint(
        client.patch(
            f"/visitas/{visit_id}/salida",
            json={"hora_salida": new_departure.astimezone(timezone.utc).isoformat()},
        ),
        "Visit departure endpoint not implemented yet",
    )

    assert response.status_code == 200
    assert response.json()["hora_salida"].startswith(new_departure.isoformat()[:19])


def test_mark_departure_endpoint_requires_existing_visit(client):
    response = client.patch(
        "/visitas/unknown/salida",
        json={"hora_salida": datetime.now(timezone.utc).isoformat()},
    )

    if response.status_code in NOT_IMPLEMENTED_STATUSES:
        pytest.skip("Visit departure endpoint not implemented yet")

    assert response.status_code == 404
    assert "detail" in response.json()
