from fastapi.testclient import TestClient


def test_register_product_missing_required_field_returns_validation_error(
    client: TestClient, valid_product_payload: dict
) -> None:
    payload = {**valid_product_payload, "nombre": ""}
    response = client.post("/api/productos", json=payload)

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["loc"][-1] == "nombre"
    assert detail["type"] == "string_too_short"


def test_register_product_invalid_price_returns_validation_error(
    client: TestClient, valid_product_payload: dict
) -> None:
    payload = {**valid_product_payload, "precio": 0}
    response = client.post("/api/productos", json=payload)

    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any(error["loc"][-1] == "precio" for error in errors)


def test_register_product_invalid_technical_sheet_url_returns_error(
    client: TestClient, valid_product_payload: dict
) -> None:
    payload = {**valid_product_payload}
    payload["hojaTecnica"] = {**payload["hojaTecnica"], "urlManual": "nota-url"}

    response = client.post("/api/productos", json=payload)

    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any("urlManual" in error["loc"][-1] for error in errors)
