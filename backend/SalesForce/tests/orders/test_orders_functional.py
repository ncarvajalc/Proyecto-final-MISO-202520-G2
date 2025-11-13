"""Functional tests for the order flow (Feat/HUP-021)."""

from __future__ import annotations

from decimal import Decimal

import pytest
from fastapi import HTTPException

from app.modules.orders.models import Order
from app.modules.orders.schemas import OrderCreate, OrderItemCreate
from app.modules.orders.services import create_order_service


def make_item(product_id: int, quantity: int) -> OrderItemCreate:
    return OrderItemCreate(
        product_id=product_id,
        product_name=f"Producto {product_id}",
        quantity=quantity,
        unit_price=Decimal("0"),
        subtotal=Decimal("0"),
    )


@pytest.mark.asyncio
async def test_create_order_persists_items(
    db_session, institutional_client_factory, mock_order_integrations
):
    institution = institutional_client_factory()
    mock_order_integrations.update(
        {
            101: {"nombre": "Kit suturas", "precio": "150000.00", "stock": 25},
            202: {"nombre": "Guantes estériles", "precio": "12000.00", "stock": 40},
        }
    )

    payload = OrderCreate(
        institutional_client_id=institution.id,
        items=[make_item(101, 2), make_item(202, 3)],
    )

    order = await create_order_service(db_session, payload)

    assert order.id is not None
    assert order.institutional_client_id == institution.id
    assert len(order.items) == 2
    assert order.items[0].product_name == "Kit suturas"
    assert order.items[0].quantity == 2
    assert order.total_amount == Decimal("399840.00")

    stored_order = db_session.query(Order).filter_by(id=order.id).first()
    assert stored_order is not None
    assert stored_order.subtotal == Decimal("336000.00")
    assert stored_order.tax_amount == Decimal("63840.00")
    assert len(stored_order.items) == 2


@pytest.mark.asyncio
async def test_create_order_requires_existing_client(fake, db_session):
    payload = OrderCreate(
        institutional_client_id=fake.uuid4(),
        items=[make_item(999, 1)],
    )

    with pytest.raises(HTTPException) as exc_info:
        await create_order_service(db_session, payload)

    assert exc_info.value.status_code == 404
    assert "Institutional client" in exc_info.value.detail


@pytest.mark.asyncio
async def test_create_order_rejects_when_inventory_insufficient(
    db_session, institutional_client_factory, mock_order_integrations
):
    institution = institutional_client_factory()
    mock_order_integrations[303] = {
        "nombre": "Bomba de infusión",
        "precio": "250000.00",
        "stock": 1,
    }

    payload = OrderCreate(
        institutional_client_id=institution.id,
        items=[make_item(303, 5)],
    )

    with pytest.raises(HTTPException) as exc_info:
        await create_order_service(db_session, payload)

    assert exc_info.value.status_code == 400
    assert "Bomba de infusión" in exc_info.value.detail
    assert db_session.query(Order).count() == 0
