from typing import Any

import pytest
from pydantic import ValidationError

from tests.suppliers_test_app import SupplierCertificate, SupplierCreate


def test_supplier_create_schema_accepts_valid_payload(valid_supplier_payload: dict[str, Any]) -> None:
    supplier = SupplierCreate(**valid_supplier_payload)
    assert supplier.nombre == valid_supplier_payload["nombre"]
    assert supplier.estado == "Activo"
    assert supplier.certificado is None


def test_supplier_create_schema_rejects_invalid_email(valid_supplier_payload: dict[str, Any]) -> None:
    invalid_payload = {**valid_supplier_payload, "correo": "correo-no-valido"}
    with pytest.raises(ValidationError):
        SupplierCreate(**invalid_payload)


def test_supplier_certificate_normalization(supplier_certificate_payload: dict[str, Any]) -> None:
    certificate = SupplierCertificate(**supplier_certificate_payload)
    assert certificate.to_response() == supplier_certificate_payload
    blank_certificate = SupplierCertificate()
    assert blank_certificate.to_response() is None
