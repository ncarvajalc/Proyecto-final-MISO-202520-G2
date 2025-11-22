"""Functional tests for the scheduled deliveries endpoint (HUP-023)."""

from __future__ import annotations

from datetime import date

import pytest

from app.modules.orders.models import Order, OrderItem
from app.modules.territories.models.territories_model import Territorio
from app.modules.territories.schemas.territories_schemas import TerritoryType


@pytest.fixture()
def seeded_client_with_order(db_session, institutional_client_factory):
    """Create a client with a pending order for a specific date."""

    country = Territorio(name="Colombia", type=TerritoryType.COUNTRY)
    city = Territorio(name="Bogotá", type=TerritoryType.CITY, parent=country)
    db_session.add_all([country, city])
    db_session.commit()

    client = institutional_client_factory(territory_id=str(city.id))
    delivery_date = date(2024, 11, 15)

    order = Order(
        institutional_client_id=client.id,
        order_date=delivery_date,
        subtotal=100,
        tax_amount=19,
        total_amount=119,
        status="pending",
        items=[
            OrderItem(
                product_id=1,
                product_name="Producto",
                quantity=1,
                unit_price=100,
                subtotal=100,
            )
        ],
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    return client, delivery_date


def test_get_scheduled_deliveries_endpoint_returns_results(client, seeded_client_with_order):
    """Happy path should return paginated deliveries enriched with territory data."""

    client_entity, delivery_date = seeded_client_with_order

    response = client.get(
        "/pedidos/entregas-programadas",
        params={
            "fecha": delivery_date.strftime("%d/%m/%Y"),
            "page": 1,
            "limit": 5,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["total_pages"] == 1

    assert len(payload["data"]) == 1
    delivery = payload["data"][0]
    assert delivery["client_name"] == client_entity.nombre_institucion
    assert delivery["country"] == "Colombia"
    assert delivery["city"] == "Bogotá"


def test_get_scheduled_deliveries_endpoint_validates_date_format(client):
    """Invalid date format should trigger a 400 error."""

    response = client.get(
        "/pedidos/entregas-programadas",
        params={"fecha": "2024-11-15", "page": 1, "limit": 5},
    )

    assert response.status_code == 400
    assert "Formato de fecha inválido" in response.json()["detail"]
