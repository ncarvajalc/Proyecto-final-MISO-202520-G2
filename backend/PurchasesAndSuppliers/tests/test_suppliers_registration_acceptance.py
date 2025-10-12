from backend.test_client import TestClient


def test_register_supplier_acceptance_flow(
    client: TestClient, valid_supplier_payload: dict, supplier_certificate_payload: dict
) -> None:
    payload = {**valid_supplier_payload, "certificado": supplier_certificate_payload}
    response = client.post("/api/proveedores", json=payload)

    assert response.status_code == 201
    body = response.json()

    assert body["id"] > 0
    assert body["nombre"] == payload["nombre"]
    assert body["estado"] == payload["estado"]
    assert body["certificado"] == supplier_certificate_payload


def test_register_supplier_acceptance_without_certificate(
    client: TestClient, valid_supplier_payload: dict
) -> None:
    response = client.post("/api/proveedores", json=valid_supplier_payload)

    assert response.status_code == 201
    body = response.json()

    assert body["certificado"] is None
    assert body["contacto"] == valid_supplier_payload["contacto"]
