from typing import Any

import pytest
from faker import Faker
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
    assert (
        product.hojaTecnica.certificaciones
        == valid_product_payload["hojaTecnica"]["certificaciones"]
    )
    assert len(product.especificaciones or []) == len(
        valid_product_payload["especificaciones"]
    )


def test_product_create_schema_rejects_negative_price(
    valid_product_payload: dict[str, Any]
) -> None:
    invalid_payload = {
        **valid_product_payload,
        "precio": -abs(valid_product_payload["precio"]),
    }
    with pytest.raises(ValidationError):
        ProductCreate(**invalid_payload)


def test_product_specification_requires_non_empty_fields(fake: Faker) -> None:
    with pytest.raises(ValidationError):
        ProductSpecification(nombre="", valor=fake.word())

    with pytest.raises(ValidationError):
        ProductSpecification(nombre=fake.word(), valor="")


def test_product_technical_sheet_normalizes_empty_values(fake: Faker) -> None:
    certification_name = fake.word().upper()
    sheet = ProductTechnicalSheet(certificaciones=["", certification_name])
    assert sheet.certificaciones == [certification_name]

    empty_sheet = ProductTechnicalSheet()
    assert empty_sheet.to_response() is None
