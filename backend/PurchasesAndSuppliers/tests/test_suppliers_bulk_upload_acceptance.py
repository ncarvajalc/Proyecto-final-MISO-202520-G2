from __future__ import annotations

from textwrap import dedent

from faker import Faker

from backend.test_client import TestClient


def test_bulk_upload_acceptance_flow(client: TestClient) -> None:
    faker = Faker("es_CO")
    faker.seed_instance(202501)

    def csv_safe(value: str) -> str:
        return value.replace(",", " ").replace("\n", " ")

    certificated_supplier = {
        "nombre": csv_safe(faker.company()),
        "id_tax": faker.numerify(text="#########-#"),
        "direccion": csv_safe(faker.street_address()),
        "telefono": csv_safe(faker.phone_number()),
        "correo": faker.unique.email(),
        "contacto": csv_safe(faker.name()),
        "estado": "Activo",
        "certificado": {
            "nombre": csv_safe(faker.bs().title()),
            "cuerpo": csv_safe(faker.company()),
            "fecha_certificacion": faker.date(),
            "fecha_vencimiento": faker.date(),
            "url": faker.url(),
        },
    }

    uncertified_supplier = {
        "nombre": csv_safe(faker.company()),
        "id_tax": faker.numerify(text="#########-#"),
        "direccion": csv_safe(faker.street_address()),
        "telefono": csv_safe(faker.phone_number()),
        "correo": faker.unique.email(),
        "contacto": csv_safe(faker.name()),
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
    body = response.json()

    assert body["summary"]["succeeded"] == 2
    assert body["summary"]["failed"] == 0
    assert body["errors"] == []

    created = body["createdSuppliers"]
    assert len(created) == 2

    certificated_response = next(
        supplier
        for supplier in created
        if supplier["nombre"] == certificated_supplier["nombre"]
    )
    assert certificated_response["certificado"] == {
        "nombre": certificated_supplier["certificado"]["nombre"],
        "cuerpoCertificador": certificated_supplier["certificado"]["cuerpo"],
        "fechaCertificacion": certificated_supplier["certificado"]["fecha_certificacion"],
        "fechaVencimiento": certificated_supplier["certificado"]["fecha_vencimiento"],
        "urlDocumento": certificated_supplier["certificado"]["url"],
    }

    uncertified_response = next(
        supplier
        for supplier in created
        if supplier["nombre"] == uncertified_supplier["nombre"]
    )
    assert uncertified_response["certificado"] is None
