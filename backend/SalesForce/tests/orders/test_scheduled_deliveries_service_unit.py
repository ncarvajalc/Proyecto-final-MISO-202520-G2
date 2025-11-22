"""Unit tests for scheduled deliveries enrichment (HUP-023)."""

from __future__ import annotations

from datetime import date

import pytest

from app.modules.orders.models import Order, OrderItem
from app.modules.orders.services.order_service import get_scheduled_deliveries_service
from app.modules.territories.models.territories_model import Territorio
from app.modules.territories.schemas.territories_schemas import TerritoryType


@pytest.fixture()
def territory_hierarchy(db_session):
    """Create a country/state/city hierarchy for address enrichment."""

    country = Territorio(name="Colombia", type=TerritoryType.COUNTRY)
    state = Territorio(name="Cundinamarca", type=TerritoryType.STATE, parent=country)
    city = Territorio(name="Bogotá", type=TerritoryType.CITY, parent=state)

    db_session.add_all([country, state, city])
    db_session.commit()
    return country, state, city


def _persist_order(
    db_session,
    client_id: str,
    delivery_date: date,
    status: str = "pending",
    *,
    product_id: int = 1,
):
    order = Order(
        institutional_client_id=client_id,
        order_date=delivery_date,
        subtotal=100,
        tax_amount=19,
        total_amount=119,
        status=status,
        items=[
            OrderItem(
                product_id=product_id,
                product_name=f"Producto {product_id}",
                quantity=1,
                unit_price=100,
                subtotal=100,
            )
        ],
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)
    return order


def test_get_scheduled_deliveries_service_enriches_results(
    db_session, institutional_client_factory, territory_hierarchy
):
    """Ensure deliveries include client and territory information with pagination."""

    _, _, city = territory_hierarchy
    client = institutional_client_factory(territory_id=str(city.id))

    delivery_date = date(2024, 11, 15)
    _persist_order(db_session, client.id, delivery_date, product_id=10)
    _persist_order(db_session, client.id, delivery_date, product_id=11)
    _persist_order(db_session, client.id, delivery_date, product_id=12)

    response = get_scheduled_deliveries_service(
        db_session, delivery_date=delivery_date, page=1, limit=2
    )

    assert response.total == 3
    assert response.total_pages == 2
    assert response.page == 1
    assert len(response.data) == 2

    client_names = {delivery.client_name for delivery in response.data}
    assert client_names == {client.nombre_institucion}

    territory_pairs = {(delivery.country, delivery.city) for delivery in response.data}
    assert territory_pairs == {("Colombia", "Bogotá")}
    assert all(delivery.address == client.direccion for delivery in response.data)


def test_get_scheduled_deliveries_service_filters_by_status_and_date(
    db_session, institutional_client_factory, territory_hierarchy
):
    """Only pending orders on the requested date should be returned."""

    _, _, city = territory_hierarchy
    client = institutional_client_factory(territory_id=str(city.id))

    target_date = date(2024, 12, 1)
    _persist_order(db_session, client.id, target_date, status="pending", product_id=20)
    _persist_order(db_session, client.id, target_date, status="shipped", product_id=21)
    _persist_order(db_session, client.id, date(2024, 12, 2), status="pending", product_id=22)

    response = get_scheduled_deliveries_service(
        db_session, delivery_date=target_date, page=1, limit=10
    )

    assert response.total == 1
    assert response.total_pages == 1
    assert len(response.data) == 1

    delivery = response.data[0]
    assert delivery.order_id
    assert delivery.client_name == client.nombre_institucion
    assert delivery.country == "Colombia"
    assert delivery.city == "Bogotá"
