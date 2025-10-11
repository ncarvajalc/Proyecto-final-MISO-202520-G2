import importlib
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

import app.main as main_module


def reload_main():
    return importlib.reload(main_module)


def test_healthcheck_reports_database_status():
    module = reload_main()
    client = TestClient(module.app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "db": True}


def test_healthcheck_reports_failure(monkeypatch):
    module = reload_main()

    def failing_session():
        raise OperationalError("SELECT 1", {}, Exception("db down"))

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
