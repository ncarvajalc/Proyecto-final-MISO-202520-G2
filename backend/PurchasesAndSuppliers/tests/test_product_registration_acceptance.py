from fastapi.testclient import TestClient


def test_register_product_acceptance_flow(
    client: TestClient, valid_product_payload: dict
) -> None:
    response = client.post("/api/productos", json=valid_product_payload)

    assert response.status_code == 201
    body = response.json()

    assert body["id"] > 0
    assert body["sku"] == valid_product_payload["sku"]
    assert body["activo"] is True
    assert body["hojaTecnica"]["certificaciones"] == ["INVIMA", "FDA"]
    assert len(body["especificaciones"]) == 2


def test_register_product_acceptance_without_optional_data(
    client: TestClient, valid_product_payload: dict
) -> None:
    minimal_payload = {
        key: value
        for key, value in valid_product_payload.items()
        if key not in {"especificaciones", "hojaTecnica", "activo"}
    }
    response = client.post("/api/productos", json=minimal_payload)

    assert response.status_code == 201
    body = response.json()

    assert body["activo"] is True
    assert body["hojaTecnica"] is None
    assert body["especificaciones"] is None
