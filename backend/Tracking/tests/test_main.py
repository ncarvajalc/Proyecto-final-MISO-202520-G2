import importlib
import sys

from faker import Faker
from sqlalchemy.exc import OperationalError

from backend.test_client import TestClient


def reload_main():
    module = sys.modules.get("app.main")
    if module is None:
        module = importlib.import_module("app.main")
    else:
        module = importlib.reload(module)
    return module
import app.main as main_module  # noqa: E402


def test_healthcheck_reports_database_status():
    module = reload_main()
    client = TestClient(module.app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "db": True}


def test_healthcheck_reports_failure(monkeypatch, fake: Faker):
    module = reload_main()

    def failing_session():
        raise OperationalError("SELECT 1", {}, Exception(fake.word()))

    monkeypatch.setattr(module, "SessionLocal", failing_session)
    client = TestClient(module.app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "error", "db": False}


def test_root_returns_default_message():
    module = reload_main()
    client = TestClient(module.app)

    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["message"].startswith("Hello from FastAPI")
