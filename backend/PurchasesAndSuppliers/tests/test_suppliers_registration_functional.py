from backend.test_client import TestClient
from faker import Faker


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
    client: TestClient, valid_supplier_payload: dict, fake: Faker
) -> None:
    payload = {**valid_supplier_payload, "nombre": fake.pystr(min_chars=0, max_chars=0)}
    response = client.post("/proveedores", json=payload)
    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["loc"][-1] == "nombre"
    assert detail["type"] == "string_too_short"


def test_register_supplier_invalid_estado_returns_validation_error(
    client: TestClient, valid_supplier_payload: dict, fake: Faker
) -> None:
    payload = {**valid_supplier_payload, "estado": fake.word()}
    response = client.post("/proveedores", json=payload)
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any(error["loc"][-1] == "estado" for error in errors)


def test_register_supplier_duplicate_id_tax_returns_conflict(
    client: TestClient, valid_supplier_payload: dict
) -> None:
    first = client.post("/proveedores", json=valid_supplier_payload)
    assert first.status_code == 201

    response = client.post("/proveedores", json=valid_supplier_payload)

    assert response.status_code == 409
    assert response.json()["detail"] == "Ya existe un proveedor con el mismo id_tax"
