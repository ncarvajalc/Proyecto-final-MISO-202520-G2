"""Unit tests for supplier bulk upload data models."""

from typing import Any, Dict, Iterable, List

import pytest
from pydantic import ValidationError

from app.modules.suppliers.models import (
    SupplierBulkUploadError,
    SupplierBulkUploadFile,
    SupplierBulkUploadResult,
    SupplierBulkUploadRow,
    SupplierBulkUploadSummary,
    SupplierCertificate,
    SupplierCreate,
    aggregate_bulk_upload_rows,
)


def build_base_row(**overrides: Any) -> Dict[str, Any]:
    base = {
        "rowNumber": 2,
        "nombre": "  Distribuciones Andinas S.A.  ",
        "id_tax": " 901234567-8 ",
        "direccion": " Av. Las Palmas #12-34 ",
        "telefono": " +57 1 765 4321 ",
        "correo": " ventas@andinas.com ",
        "contacto": " Laura Rodríguez ",
        "estado": " inactivo ",
    }
    base.update(overrides)
    return base


def test_bulk_row_accepts_nested_certificate() -> None:
    payload = build_base_row(
        certificado={
            "nombre": " ISO 9001 ",
            "cuerpoCertificador": " Icontec ",
            "fechaCertificacion": "2024-01-01",
            "fechaVencimiento": "2025-01-01",
            "urlDocumento": "",
        }
    )

    row = SupplierBulkUploadRow(**payload)

    assert row.nombre == "Distribuciones Andinas S.A."
    assert row.estado == "Inactivo"
    assert row.certificado is not None
    assert row.certificado.nombre == "ISO 9001"
    assert row.certificado.urlDocumento is None


def test_bulk_row_accepts_prefixed_certificate_headers() -> None:
    payload = build_base_row(
        rowNumber=5,
        certificadoNombre="ISO 14001",
        certificate_body="Bureau Veritas",
        certificate_issued_at="2023-05-01",
        certificate_expires_at="2026-05-01",
        certificate_url="https://example.com/certificados/iso14001.pdf",
    )

    row = SupplierBulkUploadRow(**payload)

    assert isinstance(row.certificado, SupplierCertificate)
    assert row.certificado.cuerpoCertificador == "Bureau Veritas"
    assert str(row.certificado.urlDocumento) == payload["certificate_url"]


def test_bulk_row_accepts_dotted_certificate_headers() -> None:
    payload = build_base_row(
        **{
            "certificate.nombre": "ISO 27001",
            "certificate.cuerpo": "SGS",
            "certificate.fecha_certificacion": "2022-07-01",
            "certificate.fecha_vencimiento": "2025-07-01",
        }
    )

    row = SupplierBulkUploadRow(**payload)

    assert row.certificado is not None
    assert row.certificado.nombre == "ISO 27001"
    assert row.certificado.cuerpoCertificador == "SGS"


def test_bulk_row_blank_certificate_is_none() -> None:
    payload = build_base_row(
        certificadoNombre="  ",
        certificadoCuerpo="",
        certificadoFechaCertificacion="",
        certificadoFechaVencimiento="",
        certificadoUrl=" ",
    )

    row = SupplierBulkUploadRow(**payload)

    assert row.certificado is None


def test_bulk_row_invalid_state_raises_error() -> None:
    payload = build_base_row(estado="suspendido")

    with pytest.raises(ValidationError):
        SupplierBulkUploadRow(**payload)


def test_aggregate_collects_errors_and_orders_them() -> None:
    raw_rows: Iterable[Dict[str, Any]] = [
        build_base_row(),
        {
            **build_base_row(rowNumber=3),
            "correo": "correo-no-valido",
        },
        {
            **build_base_row(rowNumber=4),
            "nombre": "",
        },
    ]

    result = aggregate_bulk_upload_rows(
        filename="proveedores.csv",
        content_type="text/csv",
        raw_rows=raw_rows,
        starting_row_number=2,
    )

    assert isinstance(result, SupplierBulkUploadResult)
    assert len(result.file.rows) == 1
    assert result.summary.total_rows == 3
    assert result.summary.succeeded == 1
    assert result.summary.failed == 2
    assert [error.row_number for error in result.errors] == [3, 4]
    assert all("loc" in error.errors[0] for error in result.errors)


def test_file_payload_conversion_matches_domain_model() -> None:
    raw_rows: List[Dict[str, Any]] = [
        build_base_row(
            certificado={
                "nombre": "ISO 9001",
                "cuerpoCertificador": "Icontec",
                "fechaCertificacion": "2024-01-01",
                "fechaVencimiento": "2025-01-01",
                "urlDocumento": "https://example.com/cert.pdf",
            }
        )
    ]

    result = aggregate_bulk_upload_rows(
        filename="proveedores.csv",
        content_type="text/csv",
        raw_rows=raw_rows,
    )

    file_model = result.file
    assert isinstance(file_model, SupplierBulkUploadFile)
    creates = file_model.to_supplier_creates()
    payloads = file_model.to_supplier_payloads()

    assert isinstance(creates[0], SupplierCreate)
    assert creates[0].certificado is not None
    assert payloads[0]["nombre"] == creates[0].nombre
    assert payloads[0]["certificado"]["nombre"] == "ISO 9001"


def test_summary_consistency_validation() -> None:
    with pytest.raises(ValidationError):
        SupplierBulkUploadSummary(
            totalRows=3,
            processedRows=2,
            succeeded=2,
            failed=1,
        )


def test_result_serialization_structure() -> None:
    error = SupplierBulkUploadError(
        rowNumber=2,
        errors=[{"loc": ("correo",), "msg": "value is not a valid email address", "type": "value_error.email"}],
        rawData={"correo": "no-email"},
    )
    summary = SupplierBulkUploadSummary(totalRows=2, processedRows=2, succeeded=1, failed=1)
    file_model = SupplierBulkUploadFile(
        filename="proveedores.csv",
        contentType="text/csv",
        rows=[SupplierBulkUploadRow(**build_base_row())],
    )

    result = SupplierBulkUploadResult(
        file=file_model,
        summary=summary,
        errors=[error],
        message="1 proveedor creado, 1 con errores",
    )

    assert result.errors[0].errors[0]["loc"] == ("correo",)
    assert result.file.to_supplier_payloads()[0]["estado"] == "Inactivo"
