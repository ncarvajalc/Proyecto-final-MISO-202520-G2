from typing import Any

import pytest
from pydantic import ValidationError

from tests.products_test_app import (
    ProductCreate,
    ProductSpecification,
    ProductTechnicalSheet,
)


def test_product_create_schema_accepts_valid_payload(
    valid_product_payload: dict[str, Any]
) -> None:
    product = ProductCreate(**valid_product_payload)

    assert product.sku == valid_product_payload["sku"]
    assert product.precio == valid_product_payload["precio"]
    assert product.hojaTecnica is not None
    assert product.hojaTecnica.certificaciones == ["INVIMA", "FDA"]
    assert len(product.especificaciones or []) == 2


def test_product_create_schema_rejects_negative_price(
    valid_product_payload: dict[str, Any]
) -> None:
    invalid_payload = {**valid_product_payload, "precio": -10}
    with pytest.raises(ValidationError):
        ProductCreate(**invalid_payload)


def test_product_specification_requires_non_empty_fields() -> None:
    with pytest.raises(ValidationError):
        ProductSpecification(nombre="", valor="valor")

    with pytest.raises(ValidationError):
        ProductSpecification(nombre="Nombre", valor="")


def test_product_technical_sheet_normalizes_empty_values() -> None:
    sheet = ProductTechnicalSheet(certificaciones=["", "INVIMA"])
    assert sheet.certificaciones == ["INVIMA"]

    empty_sheet = ProductTechnicalSheet()
    assert empty_sheet.to_response() is None
