"""Acceptance tests covering Feat/HUP-021."""

from __future__ import annotations

from decimal import Decimal

import pytest
from faker import Faker

from app.modules.institutional_clients.schemas import InstitutionalClientCreate
from app.modules.institutional_clients.services import create as create_institution
from app.modules.orders.routes.orders import get_order_endpoint, list_orders_endpoint
from app.modules.orders.schemas import OrderCreate, OrderItemCreate
from app.modules.orders.services import create_order_service


def build_order_payload(client_id: str) -> OrderCreate:
    return OrderCreate(
        institutional_client_id=client_id,
        items=[
            OrderItemCreate(
                product_id=3001,
                product_name="Monitor de signos vitales",
                quantity=2,
                unit_price=Decimal("0"),
                subtotal=Decimal("0"),
            ),
            OrderItemCreate(
                product_id=3002,
                product_name="Kit de intubación",
                quantity=1,
                unit_price=Decimal("0"),
                subtotal=Decimal("0"),
            ),
        ],
    )


@pytest.mark.asyncio
async def test_order_creation_flow_acceptance(
    db_session, fake: Faker, mock_order_integrations
):
    client_payload = InstitutionalClientCreate(
        nombre_institucion=fake.company(),
        direccion=fake.street_address().replace("\n", " "),
        direccion_institucional=fake.unique.company_email(),
        identificacion_tributaria=fake.unique.bothify(text="NIT##########"),
        representante_legal=fake.name(),
        telefono=fake.msisdn(),
        justificacion_acceso="Abastecer la red hospitalaria",
        certificado_camara="ZmFrZS1jZXJ0",
        territory_id=None,
    )
    institution = create_institution(db_session, client_payload)

    mock_order_integrations.update(
        {
            3001: {"nombre": "Monitor de signos vitales", "precio": "420000.00", "stock": 6},
            3002: {"nombre": "Kit de intubación", "precio": "185000.00", "stock": 6},
        }
    )

    order_payload = build_order_payload(institution.id)
    created_order = await create_order_service(db_session, order_payload)

    assert created_order.institutional_client_id == institution.id
    assert created_order.status == "pending"
    assert {item.product_name for item in created_order.items} == {
        "Monitor de signos vitales",
        "Kit de intubación",
    }
    assert Decimal(str(created_order.subtotal)) == Decimal("1025000.00")
    assert Decimal(str(created_order.tax_amount)) == Decimal("194750.00")
    assert Decimal(str(created_order.total_amount)) == Decimal("1219750.00")

    paginated = list_orders_endpoint(page=1, limit=10, db=db_session)
    assert paginated.total == 1
    assert paginated.page == 1
    assert paginated.total_pages == 1
    assert len(paginated.data) == 1
    assert paginated.data[0].id == created_order.id
    assert paginated.data[0].items[0].product_name in {
        "Monitor de signos vitales",
        "Kit de intubación",
    }

    detail = get_order_endpoint(created_order.id, db_session)
    assert detail.id == created_order.id
    assert detail.institutional_client_id == institution.id
    assert {item.product_name for item in detail.items} == {
        "Monitor de signos vitales",
        "Kit de intubación",
    }
