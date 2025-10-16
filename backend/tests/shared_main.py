"""Shared helpers for testing FastAPI main modules."""

from __future__ import annotations

import importlib
import sys
from types import ModuleType

from backend.test_client import TestClient


def reload_main(module_path: str = "app.main") -> ModuleType:
    """Reload and return the module containing the FastAPI application."""

    module = sys.modules.get(module_path)
    if module is None:
        module = importlib.import_module(module_path)
    else:
        module = importlib.reload(module)
    return module


def create_test_client(target: ModuleType | str = "app.main") -> TestClient:
    """Create a :class:`TestClient` from an app module or module path."""

    module = reload_main(target) if isinstance(target, str) else target
    return TestClient(module.app)


def assert_health(client: TestClient, *, healthy: bool = True) -> None:
    """Assert the health endpoint response matches the expected status."""

    response = client.get("/health")
    assert response.status_code == 200
    expected = {"status": "ok", "db": True} if healthy else {"status": "error", "db": False}
    assert response.json() == expected


def assert_root_message(client: TestClient, prefix: str = "Hello from FastAPI") -> None:
    """Assert the root endpoint returns the expected greeting."""

    response = client.get("/")
    assert response.status_code == 200
    message = response.json().get("message", "")
    assert isinstance(message, str)
    assert message.startswith(prefix)
