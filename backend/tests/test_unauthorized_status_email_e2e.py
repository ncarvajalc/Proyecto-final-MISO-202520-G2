from __future__ import annotations

import asyncio
import importlib
import os
from pathlib import Path
from typing import Any, Dict

import httpx
import pytest
from httpx import ASGITransport

from backend.tests.shared_main import (
    _prepare_package_root,
    create_test_client,
    reload_main,
)
from backend.tests.smtp_helpers import SMTPServerController


@pytest.fixture()
def audit_stack(unused_tcp_port):
    db_file = Path("audit_e2e.db")
    if db_file.exists():
        db_file.unlink()

    smtp_host = "127.0.0.1"
    smtp_port = unused_tcp_port

    os.environ.update(
        {
            "TESTING": "1",
            "TEST_DATABASE_URL": f"sqlite:///{db_file}",
            "SMTP_HOST": smtp_host,
            "SMTP_PORT": str(smtp_port),
            "ADMIN_EMAIL": "admin@example.com",
            "ALERT_SENDER_EMAIL": "alerts@example.com",
            "EMAIL_DELIVERY_MODE": "smtp",
        }
    )

    _prepare_package_root(Path("backend/SecurityAndAudit"))

    import app.core.config as audit_config
    import app.core.database as audit_database
    import app.core.init_db as audit_init_db
    from app.modules.audit.services import email_service

    importlib.reload(audit_config)
    importlib.reload(audit_database)
    importlib.reload(audit_init_db)
    email_service.settings = audit_config.Settings()

    audit_module = reload_main(package_root="backend/SecurityAndAudit")
    audit_init_db.init_db()

    audit_client = httpx.AsyncClient(
        transport=ASGITransport(app=audit_module.app, raise_app_exceptions=True),
        base_url="http://security-audit.test",
    )

    with SMTPServerController(smtp_host, smtp_port) as smtp_controller:
        yield {
            "client": audit_client,
            "smtp": smtp_controller,
            "db_file": db_file,
            "database": audit_database,
            "init_db": audit_init_db,
        }

    asyncio.run(audit_client.aclose())
    audit_database.engine.dispose()
    if db_file.exists():
        db_file.unlink()


@pytest.fixture()
def salesforce_stack(tmp_path):
    db_file = tmp_path / "sales_e2e.db"
    os.environ.update(
        {
            "TESTING": "1",
            "TEST_DATABASE_URL": f"sqlite:///{db_file}",
            "SECURITY_AUDIT_URL": "http://security-audit.test",
        }
    )

    _prepare_package_root(Path("backend/SalesForce"))

    import app.core.config as sales_config
    import app.core.database as sales_db_module

    importlib.reload(sales_config)
    importlib.reload(sales_db_module)

    sales_module = reload_main(package_root="backend/SalesForce")

    sales_db_module.Base.metadata.create_all(bind=sales_db_module.engine)
    client = create_test_client(sales_module)

    yield {
        "client": client,
        "db_module": sales_db_module,
        "db_file": db_file,
    }

    sales_db_module.Base.metadata.drop_all(bind=sales_db_module.engine)
    sales_db_module.engine.dispose()
    if db_file.exists():
        db_file.unlink()


@pytest.mark.asyncio
def test_unauthorized_order_status_sends_email_end_to_end(
    audit_stack, salesforce_stack, monkeypatch
):
    audit_client = audit_stack["client"]
    smtp_controller = audit_stack["smtp"]
    sales_client = salesforce_stack["client"]
    sales_db_module = salesforce_stack["db_module"]

    from app.modules.institutional_clients.models import InstitutionalClient
    from app.modules.orders.schemas import OrderCreate, OrderItemCreate
    from app.modules.orders.services import order_service

    order_service.SECURITY_AUDIT_URL = "http://security-audit.test"

    def forward_alert(url: str, *args: Any, **kwargs: Any):
        assert url.startswith("http://security-audit.test")
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(audit_client.post(url, *args, **kwargs))
        finally:
            loop.close()

    monkeypatch.setattr(order_service.httpx, "post", forward_alert)

    product_catalog: Dict[int, Dict[str, Any]] = {1001: {"nombre": "Guantes", "precio": "10000.00"}}

    async def fake_validate_product(product_id: int):
        if product_id not in product_catalog:
            raise AssertionError("Producto no válido")
        product = product_catalog[product_id]
        return {"nombre": product["nombre"], "precio": product["precio"], "sku": f"SKU-{product_id}"}

    async def fake_validate_inventory(product_id: int, quantity: int):
        return True

    monkeypatch.setattr(order_service, "validate_product", fake_validate_product)
    monkeypatch.setattr(order_service, "validate_inventory", fake_validate_inventory)

    session = sales_db_module.SessionLocal()
    client_record = InstitutionalClient(
        nombre_institucion="Cliente E2E",
        direccion="Calle 1",
        direccion_institucional="cliente@example.com",
        identificacion_tributaria="NIT-0001",
        representante_legal="Sr. Cliente",
        telefono="1234567",
        justificacion_acceso="Pruebas",
        certificado_camara="ZmFrZS1jZXJ0",
        territory_id=None,
    )
    session.add(client_record)
    session.commit()
    session.refresh(client_record)

    order_payload = OrderCreate(
        institutional_client_id=client_record.id,
        items=[OrderItemCreate(product_id=1001, quantity=1, product_name="Guantes", unit_price=0, subtotal=0)],
    )

    created_order = asyncio.run(order_service.create_order_service(session, order_payload))
    session.close()

    unauthorized_response = sales_client.get(f"/pedidos/{created_order.id}")
    assert unauthorized_response.status_code == 403

    assert len(smtp_controller.messages) == 1
    message = smtp_controller.messages[0]["data"]
    assert str(created_order.id) in message
    assert "consulta no autorizada" in message.lower()

    second_response = asyncio.run(
        audit_client.post(
            "/audit/alerts/unauthorized-order-status",
            json={
                "order_id": str(created_order.id),
                "user_id": None,
                "user_role": None,
                "source_ip": "testclient",
                "reason": "Rol no provisto",
            },
        )
    )

    assert second_response.status_code == 201
    assert len(smtp_controller.messages) == 2
