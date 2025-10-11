from sqlalchemy.orm import Session

from tests.products_test_app import Product


def test_register_product_persists_data(
    client, db_session: Session, valid_product_payload: dict
) -> None:
    response = client.post("/api/productos", json=valid_product_payload)

    assert response.status_code == 201
    data = response.json()
    assert data["sku"] == valid_product_payload["sku"]
    assert data["hojaTecnica"]["urlManual"] == valid_product_payload["hojaTecnica"]["urlManual"]

    stored = db_session.query(Product).filter_by(id=data["id"]).one()
    assert stored.nombre == valid_product_payload["nombre"]
    assert stored.hoja_tecnica_manual == valid_product_payload["hojaTecnica"]["urlManual"]
    assert stored.especificaciones_json is not None


def test_register_product_without_optional_fields(
    client, db_session: Session, valid_product_payload: dict
) -> None:
    payload = {key: value for key, value in valid_product_payload.items() if key not in {"especificaciones", "hojaTecnica"}}
    response = client.post("/api/productos", json=payload)

    assert response.status_code == 201
    product_id = response.json()["id"]

    stored = db_session.query(Product).filter_by(id=product_id).one()
    assert stored.especificaciones_json is None
    assert stored.hoja_tecnica_manual is None
    assert stored.hoja_tecnica_certificaciones is None
