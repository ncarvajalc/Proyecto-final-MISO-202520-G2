"""Unit tests for the order service logic (Feat/HUP-021)."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.modules.orders.schemas import OrderCreate, OrderItemCreate
from app.modules.orders.services import order_service


@pytest.fixture()
def single_item_payload() -> OrderCreate:
    return OrderCreate(
        institutional_client_id="inst-unit-001",
        items=[
            OrderItemCreate(
                product_id=101,
                product_name="Placeholder",
                quantity=2,
                unit_price=Decimal("0"),
                subtotal=Decimal("0"),
            )
        ],
    )


@pytest.fixture()
def multi_item_payload() -> OrderCreate:
    return OrderCreate(
        institutional_client_id="inst-unit-002",
        items=[
            OrderItemCreate(
                product_id=201,
                product_name="Placeholder A",
                quantity=2,
                unit_price=Decimal("0"),
                subtotal=Decimal("0"),
            ),
            OrderItemCreate(
                product_id=202,
                product_name="Placeholder B",
                quantity=1,
                unit_price=Decimal("0"),
                subtotal=Decimal("0"),
            ),
        ],
    )


@pytest.mark.asyncio
async def test_create_order_service_requires_existing_client(monkeypatch, single_item_payload):
    monkeypatch.setattr(order_service, "get_institutional_client_by_id", lambda *args, **kwargs: None)

    with pytest.raises(HTTPException) as exc_info:
        await order_service.create_order_service(db=object(), order_create=single_item_payload)

    assert exc_info.value.status_code == 404
    assert "Institutional client" in exc_info.value.detail


@pytest.mark.asyncio
async def test_create_order_service_rejects_when_inventory_missing(monkeypatch, single_item_payload):
    monkeypatch.setattr(order_service, "get_institutional_client_by_id", lambda *args, **kwargs: object())

    async def fake_validate_product(product_id: int):
        return {"id": product_id, "nombre": "Guantes de látex", "precio": "15000.00"}

    async def fake_validate_inventory(product_id: int, quantity: int):
        return False

    monkeypatch.setattr(order_service, "validate_product", fake_validate_product)
    monkeypatch.setattr(order_service, "validate_inventory", fake_validate_inventory)

    with pytest.raises(HTTPException) as exc_info:
        await order_service.create_order_service(db=object(), order_create=single_item_payload)

    assert exc_info.value.status_code == 400
    assert "Guantes de látex" in exc_info.value.detail


@pytest.mark.asyncio
async def test_create_order_service_calculates_totals(monkeypatch, multi_item_payload):
    monkeypatch.setattr(order_service, "get_institutional_client_by_id", lambda *args, **kwargs: object())

    price_map = {
        multi_item_payload.items[0].product_id: Decimal("120000.00"),
        multi_item_payload.items[1].product_id: Decimal("80000.00"),
    }

    async def fake_validate_product(product_id: int):
        return {
            "id": product_id,
            "nombre": f"Producto {product_id}",
            "precio": str(price_map[product_id]),
        }

    async def fake_validate_inventory(product_id: int, quantity: int):
        return True

    captured = {}

    def fake_create_order_with_items(
        db,
        institutional_client_id,
        order_date,
        subtotal,
        tax_amount,
        total_amount,
        status,
        items,
    ):
        captured.update(
            {
                "institutional_client_id": institutional_client_id,
                "order_date": order_date,
                "subtotal": subtotal,
                "tax_amount": tax_amount,
                "total_amount": total_amount,
                "status": status,
                "items": items,
            }
        )
        return SimpleNamespace(
            id=999,
            institutional_client_id=institutional_client_id,
            order_date=order_date,
            subtotal=subtotal,
            tax_amount=tax_amount,
            total_amount=total_amount,
            status=status,
            items=items,
        )

    monkeypatch.setattr(order_service, "validate_product", fake_validate_product)
    monkeypatch.setattr(order_service, "validate_inventory", fake_validate_inventory)
    monkeypatch.setattr(order_service, "create_order_with_items", fake_create_order_with_items)

    result = await order_service.create_order_service(db=object(), order_create=multi_item_payload)

    assert result.id == 999
    assert captured["institutional_client_id"] == multi_item_payload.institutional_client_id
    assert captured["status"] == "pending"
    assert captured["order_date"] == date.today()

    expected_subtotal = Decimal("320000.00")
    expected_tax = Decimal("60800.00")
    expected_total = Decimal("380800.00")

    assert captured["subtotal"] == expected_subtotal
    assert captured["tax_amount"] == expected_tax
    assert captured["total_amount"] == expected_total
    assert captured["items"][0]["product_name"] == "Producto 201"
    assert captured["items"][0]["subtotal"] == Decimal("240000.00")
    assert captured["items"][1]["product_name"] == "Producto 202"
    assert captured["items"][1]["subtotal"] == Decimal("80000.00")


def test_summarize_order_builds_expected_status():
    order = SimpleNamespace(
        id=42,
        institutional_client_id="inst-unit-xyz",
        order_date=date(2024, 5, 20),
        subtotal=Decimal("300000.00"),
        tax_amount=Decimal("57000.00"),
        total_amount=Decimal("357000.00"),
        status="in_transit",
        institutional_client=SimpleNamespace(nombre_institucion="Clínica Central"),
        items=[
            SimpleNamespace(
                product_id=501,
                product_name="Monitor cardíaco",
                quantity=2,
                unit_price=Decimal("100000.00"),
                subtotal=Decimal("200000.00"),
            ),
            SimpleNamespace(
                product_id=502,
                product_name="Bisturí eléctrico",
                quantity=1,
                unit_price=Decimal("100000.00"),
                subtotal=Decimal("100000.00"),
            ),
        ],
    )

    summary = order_service.summarize_order(order)

    assert summary.id == 42
    assert summary.order_number == "42"
    assert summary.institutional_client_id == "inst-unit-xyz"
    assert summary.client_name == "Clínica Central"
    assert summary.product_count == 2
    assert summary.total_units == 3
    assert summary.total_amount == Decimal("357000.00")
    assert [item.product_name for item in summary.items] == [
        "Monitor cardíaco",
        "Bisturí eléctrico",
    ]
    assert summary.items[0].unit == "unidad"
    assert summary.items[0].unit_price == Decimal("100000.00")
    assert summary.items[0].total_price == Decimal("200000.00")
