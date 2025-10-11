from fastapi.testclient import TestClient


def test_healthcheck_returns_database_status(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["db"] is True


def test_root_endpoint_returns_message(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"].startswith("Hello")


def test_register_supplier_missing_required_field_returns_validation_error(
    client: TestClient, valid_supplier_payload: dict
) -> None:
    payload = {**valid_supplier_payload, "nombre": ""}
    response = client.post("/api/proveedores", json=payload)
    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["loc"][-1] == "nombre"
    assert detail["type"] == "string_too_short"


def test_register_supplier_invalid_estado_returns_validation_error(
    client: TestClient, valid_supplier_payload: dict
) -> None:
    payload = {**valid_supplier_payload, "estado": "Suspendido"}
    response = client.post("/api/proveedores", json=payload)
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any(error["loc"][-1] == "estado" for error in errors)
