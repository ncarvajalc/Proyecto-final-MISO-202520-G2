from __future__ import annotations

from textwrap import dedent

from sqlalchemy.orm import Session

from backend.test_client import TestClient
from app.modules.suppliers.models.orm import Supplier
from faker import Faker


def _csv_safe(value: str) -> str:
    return value.replace(",", " ").replace("\n", " ")


def test_bulk_upload_persists_suppliers(
    client: TestClient, db_session: Session
) -> None:
    faker = Faker("es_CO")
    faker.seed_instance(202502)

    first_supplier = {
        "nombre": _csv_safe(faker.company()),
        "id_tax": faker.numerify(text="#########"),
        "direccion": _csv_safe(faker.street_address()),
        "telefono": _csv_safe(faker.msisdn()),
        "correo": faker.unique.email(),
        "contacto": _csv_safe(faker.name()),
        "estado": "Activo",
    }

    second_supplier = {
        "nombre": _csv_safe(faker.company()),
        "id_tax": faker.numerify(text="#########"),
        "direccion": _csv_safe(faker.street_address()),
        "telefono": _csv_safe(faker.msisdn()),
        "correo": faker.unique.email(),
        "contacto": _csv_safe(faker.name()),
        "estado": "Inactivo",
    }

    csv_content = dedent(
        f"""
        nombre,id_tax,direccion,telefono,correo,contacto,estado
        {first_supplier['nombre']},{first_supplier['id_tax']},{first_supplier['direccion']},{first_supplier['telefono']},{first_supplier['correo']},{first_supplier['contacto']},{first_supplier['estado']}
        {second_supplier['nombre']},{second_supplier['id_tax']},{second_supplier['direccion']},{second_supplier['telefono']},{second_supplier['correo']},{second_supplier['contacto']},{second_supplier['estado']}
        """
    ).strip()

    response = client.post(
        "/proveedores/bulk-upload",
        files={"file": ("proveedores.csv", csv_content, "text/csv")},
    )

    assert response.status_code == 201
    payload = response.json()

    assert payload["summary"]["succeeded"] == 2
    assert payload["summary"]["failed"] == 0
    assert len(payload["createdSuppliers"]) == 2

    stored = db_session.query(Supplier).all()
    assert len(stored) == 2
    emails = {supplier.correo for supplier in stored}
    assert first_supplier["correo"] in emails
    assert second_supplier["correo"] in emails


def test_bulk_upload_with_real_sample_inserts_expected_rows(
    client: TestClient, db_session: Session
) -> None:
    faker = Faker("es_CO")
    faker.seed_instance(202503)

    certificated_supplier = {
        "nombre": _csv_safe(faker.company()),
        "id_tax": faker.numerify(text="#########-#"),
        "direccion": _csv_safe(faker.street_address()),
        "telefono": _csv_safe(faker.phone_number()),
        "correo": faker.unique.email(),
        "contacto": _csv_safe(faker.name()),
        "estado": "Activo",
        "certificado": {
            "nombre": _csv_safe(faker.bs().title()),
            "cuerpo": _csv_safe(faker.company()),
            "fecha_certificacion": faker.date(),
            "fecha_vencimiento": faker.date(),
            "url": faker.url(),
        },
    }

    uncertified_supplier = {
        "nombre": _csv_safe(faker.company()),
        "id_tax": faker.numerify(text="#########-#"),
        "direccion": _csv_safe(faker.street_address()),
        "telefono": _csv_safe(faker.phone_number()),
        "correo": faker.unique.email(),
        "contacto": _csv_safe(faker.name()),
        "estado": "Activo",
    }

    empty_certificate_fields = ",".join([""] * 5)

    csv_content = dedent(
        f"""
        nombre,idTax,direccion,telefono,correo,contacto,estado,certificadoNombre,certificadoCuerpo,certificadoFechaCertificacion,certificadoFechaVencimiento,certificadoUrl
        {certificated_supplier['nombre']},{certificated_supplier['id_tax']},{certificated_supplier['direccion']},{certificated_supplier['telefono']},{certificated_supplier['correo']},{certificated_supplier['contacto']},{certificated_supplier['estado']},{certificated_supplier['certificado']['nombre']},{certificated_supplier['certificado']['cuerpo']},{certificated_supplier['certificado']['fecha_certificacion']},{certificated_supplier['certificado']['fecha_vencimiento']},{certificated_supplier['certificado']['url']}
        {uncertified_supplier['nombre']},{uncertified_supplier['id_tax']},{uncertified_supplier['direccion']},{uncertified_supplier['telefono']},{uncertified_supplier['correo']},{uncertified_supplier['contacto']},{uncertified_supplier['estado']},{empty_certificate_fields}
        """
    ).strip()

    response = client.post(
        "/proveedores/bulk-upload",
        files={"file": ("proveedores.csv", csv_content, "text/csv")},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["summary"]["succeeded"] == 2
    assert payload["errors"] == []

    stored = db_session.query(Supplier).order_by(Supplier.nombre).all()
    assert len(stored) == 2

    stored_by_name = {supplier.nombre: supplier for supplier in stored}
    assert set(stored_by_name) == {
        uncertified_supplier["nombre"],
        certificated_supplier["nombre"],
    }

    certificated_stored = stored_by_name[certificated_supplier["nombre"]]
    other_supplier = stored_by_name[uncertified_supplier["nombre"]]

    assert (
        certificated_stored.certificado_nombre
        == certificated_supplier["certificado"]["nombre"]
    )
    assert (
        certificated_stored.certificado_cuerpo
        == certificated_supplier["certificado"]["cuerpo"]
    )
    assert (
        certificated_stored.certificado_fecha_certificacion
        == certificated_supplier["certificado"]["fecha_certificacion"]
    )
    assert (
        certificated_stored.certificado_fecha_vencimiento
        == certificated_supplier["certificado"]["fecha_vencimiento"]
    )
    assert (
        certificated_stored.certificado_url
        == certificated_supplier["certificado"]["url"]
    )

    assert other_supplier.certificado_nombre is None
    assert other_supplier.certificado_cuerpo is None
    assert other_supplier.certificado_fecha_certificacion is None
    assert other_supplier.certificado_fecha_vencimiento is None
    assert other_supplier.certificado_url is None


def test_list_suppliers_returns_paginated_results(client: TestClient, db_session: Session) -> None:
    faker = Faker("es_CO")
    faker.seed_instance(202504)

    suppliers = []
    suppliers_data = []
    for index in range(3):
        supplier_data = {
            "nombre": _csv_safe(f"{faker.company()} #{index}"),
            "id_tax": f"NIT-{faker.numerify(text='####')}",
            "direccion": _csv_safe(faker.street_address()),
            "telefono": _csv_safe(faker.msisdn()),
            "correo": faker.unique.email(),
            "contacto": _csv_safe(faker.name()),
            "estado": faker.random_element(["Activo", "Inactivo"]),
        }
        suppliers_data.append(supplier_data)
        suppliers.append(
            Supplier(
                nombre=supplier_data["nombre"],
                id_tax=supplier_data["id_tax"],
                direccion=supplier_data["direccion"],
                telefono=supplier_data["telefono"],
                correo=supplier_data["correo"],
                contacto=supplier_data["contacto"],
                estado=supplier_data["estado"],
            )
        )

    db_session.add_all(suppliers)
    db_session.commit()

    response = client.get("/proveedores", params={"page": 1, "limit": 2})
    assert response.status_code == 200
    payload = response.json()

    assert payload["total"] == 3
    assert payload["page"] == 1
    assert payload["limit"] == 2
    assert payload["totalPages"] == 2
    assert len(payload["data"]) == 2

    first_supplier = payload["data"][0]
    assert first_supplier["nombre"] == suppliers_data[0]["nombre"]
    assert first_supplier["id_tax"] == suppliers_data[0]["id_tax"]
