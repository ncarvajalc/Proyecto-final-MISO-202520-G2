from __future__ import annotations

from textwrap import dedent

import pytest
from faker import Faker

from app.modules.suppliers.services.bulk_upload import build_summary, parse_csv_bytes

from .utils import csv_safe


def test_parse_csv_bytes_returns_rows() -> None:
    faker = Faker("es_CO")
    faker.seed_instance(202505)

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
        "estado": faker.random_element(["Activo", "Inactivo"]),
    }

    empty_certificate_fields = ",".join([""] * 5)

    content = dedent(
        f"""
        nombre,idTax,direccion,telefono,correo,contacto,estado,certificadoNombre,certificadoCuerpo,certificadoFechaCertificacion,certificadoFechaVencimiento,certificadoUrl
        {certificated_supplier['nombre']},{certificated_supplier['id_tax']},{certificated_supplier['direccion']},{certificated_supplier['telefono']},{certificated_supplier['correo']},{certificated_supplier['contacto']},{certificated_supplier['estado']},{certificated_supplier['certificado']['nombre']},{certificated_supplier['certificado']['cuerpo']},{certificated_supplier['certificado']['fecha_certificacion']},{certificated_supplier['certificado']['fecha_vencimiento']},{certificated_supplier['certificado']['url']}
        {uncertified_supplier['nombre']},{uncertified_supplier['id_tax']},{uncertified_supplier['direccion']},{uncertified_supplier['telefono']},{uncertified_supplier['correo']},{uncertified_supplier['contacto']},{uncertified_supplier['estado']},{empty_certificate_fields}
        """
    ).strip().encode("utf-8")

    rows = parse_csv_bytes(content)

    assert len(rows) == 2
    assert rows[0]["id_tax"] == certificated_supplier["id_tax"]
    assert (
        rows[0]["certificado_nombre"]
        == certificated_supplier["certificado"]["nombre"]
    )
    assert (
        rows[0]["certificado_url"]
        == certificated_supplier["certificado"]["url"]
    )
    assert rows[1]["certificado_nombre"] == ""
    assert rows[1]["estado"] == uncertified_supplier["estado"]


def test_parse_csv_bytes_without_headers_raises_error() -> None:
    faker = Faker()
    faker.seed_instance(202506)

    raw_row = f"{faker.company()},{faker.numerify(text='#########')}\n"

    with pytest.raises(ValueError):
        parse_csv_bytes(raw_row.encode("utf-8"))


def test_build_summary_produces_consistent_totals() -> None:
    summary = build_summary(total_rows=5, succeeded=3, failed=2)

    assert summary.total_rows == 5
    assert summary.processed_rows == 5
    assert summary.succeeded == 3
    assert summary.failed == 2
    assert summary.succeeded + summary.failed == summary.processed_rows
