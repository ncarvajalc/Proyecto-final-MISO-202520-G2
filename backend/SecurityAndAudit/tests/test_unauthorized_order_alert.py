from __future__ import annotations

import importlib
import os
from pathlib import Path

import pytest
from sqlalchemy import select

from backend.tests.shared_main import reload_main
from backend.test_client import TestClient
from backend.tests.smtp_helpers import SMTPServerController


@pytest.fixture()
def setup_database():
    db_file = Path("test_security_alerts.db")
    if db_file.exists():
        db_file.unlink()

    os.environ["TESTING"] = "1"
    os.environ["TEST_DATABASE_URL"] = f"sqlite:///{db_file}"

    from app.core import config as config_module
    from app.core import database as database_module
    from app.core import init_db as init_db_module
    from app.modules.access import models as access_models
    from app.modules.audit import models as audit_models

    importlib.reload(config_module)
    importlib.reload(database_module)
    importlib.reload(init_db_module)
    importlib.reload(access_models)
    importlib.reload(audit_models)

    init_db_module.init_db()
    yield
    init_db_module.drop_db()
    if db_file.exists():
        db_file.unlink()


@pytest.fixture()
def smtp_server(free_tcp_port):
    smtp_host = "127.0.0.1"
    smtp_port = free_tcp_port
    os.environ.update(
        {
            "SMTP_HOST": smtp_host,
            "SMTP_PORT": str(smtp_port),
            "ADMIN_EMAIL": "admin@example.com",
            "ALERT_SENDER_EMAIL": "alerts@example.com",
            "EMAIL_DELIVERY_MODE": "smtp",
        }
    )

    from app.core import config as config_module
    from app.modules.audit.services import email_service

    importlib.reload(config_module)
    email_service.settings = config_module.Settings()

    with SMTPServerController(smtp_host, smtp_port) as controller:
        yield controller


@pytest.mark.usefixtures("setup_database")
def test_security_alert_is_recorded_and_email_sent(smtp_server):
    audit_module = reload_main(package_root="backend/SecurityAndAudit")
    client = TestClient(audit_module.app)

    payload = {
        "order_id": "A-12345",
        "user_id": "intruder-1",
        "user_role": "guest",
        "source_ip": "127.0.0.1",
        "reason": "Test alert",
    }

    response = client.post("/audit/alerts/unauthorized-order-status", json=payload)
    body = response.json()

    assert response.status_code == 201
    assert body["event_type"] == "unauthorized_order_status_query"
    assert body["severity"] in {"high", "critical"}
    assert body["processing_time_ms"] < 2000

    from app.core.database import SessionLocal
    from app.modules.audit.models import SecurityAlert

    with SessionLocal() as session:
        stored = session.execute(select(SecurityAlert)).scalar_one()
        assert stored.order_id == payload["order_id"]
        assert stored.actor_id == payload["user_id"]
        assert stored.source_ip == payload["source_ip"]

    assert len(smtp_server.messages) == 1
    message = smtp_server.messages[0]["data"]
    assert payload["order_id"] in message
    assert payload["user_id"] in message
