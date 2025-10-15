from sqlalchemy.orm import Session

from app.modules.suppliers.models.orm import Supplier


def test_register_supplier_persists_data(
    client, db_session: Session, valid_supplier_payload: dict
) -> None:
    response = client.post("/proveedores", json=valid_supplier_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["nombre"] == valid_supplier_payload["nombre"]
    assert data["certificado"] is None

    stored = db_session.query(Supplier).filter_by(id=data["id"]).one()
    assert stored.nombre == valid_supplier_payload["nombre"]
    assert stored.certificado_nombre is None


def test_register_supplier_with_optional_fields_is_saved(
    client, db_session: Session, valid_supplier_payload: dict, supplier_certificate_payload: dict
) -> None:
    payload = {**valid_supplier_payload, "certificado": supplier_certificate_payload}
    response = client.post("/proveedores", json=payload)
    assert response.status_code == 201
    supplier_id = response.json()["id"]

    stored = db_session.query(Supplier).filter_by(id=supplier_id).one()
    assert stored.certificado_nombre == supplier_certificate_payload["nombre"]
    assert stored.certificado_url == supplier_certificate_payload["urlDocumento"]
