from __future__ import annotations

import asyncio
from decimal import Decimal
import time

from app.modules.institutional_clients.schemas import InstitutionalClientCreate
from app.modules.institutional_clients.services import create as create_institution
from app.modules.orders.schemas import OrderCreate, OrderItemCreate
from app.modules.orders.services import create_order_service
from app.modules.orders.routes import orders as orders_routes


def test_unauthorized_status_request_triggers_alert(
    client, db_session, mock_order_integrations, monkeypatch
):
    institution = create_institution(
        db_session,
        InstitutionalClientCreate(
            nombre_institucion="Clinica Central",
            direccion="Calle Falsa 123",
            direccion_institucional="contacto@clinica.com",
            identificacion_tributaria="NIT123456",
            representante_legal="Ana Perez",
            telefono="1234567",
            justificacion_acceso="Compras hospitalarias",
            certificado_camara="ZmFrZS1jZXJ0",
            territory_id=None,
        ),
    )

    mock_order_integrations[101] = {
        "nombre": "Kit de sutura",
        "precio": "100000.00",
        "stock": 5,
    }

    order_payload = OrderCreate(
        institutional_client_id=institution.id,
        items=[
            OrderItemCreate(
                product_id=101,
                product_name="Kit de sutura",
                quantity=1,
                unit_price=Decimal("100000.00"),
                subtotal=Decimal("100000.00"),
            )
        ],
    )

    created_order = asyncio.run(create_order_service(db_session, order_payload))

    captured_calls: list[dict] = []

    def fake_report(order_id, user_id, user_role, source_ip, reason):  # noqa: ANN001
        captured_calls.append(
            {
                "order_id": order_id,
                "user_id": user_id,
                "user_role": user_role,
                "source_ip": source_ip,
                "reason": reason,
            }
        )

    monkeypatch.setattr(
        orders_routes,
        "report_unauthorized_order_status_attempt",
        fake_report,
    )

    start = time.perf_counter()
    response = client.get(f"/pedidos/{created_order.id}")
    elapsed = time.perf_counter() - start

    assert response.status_code == 403
    assert elapsed < 2
    assert len(captured_calls) == 1
    recorded = captured_calls[0]
    assert recorded["order_id"] == created_order.id
    assert recorded["user_role"] is None
    assert "Rol" in recorded["reason"]
