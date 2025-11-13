"""Shared helpers for testing FastAPI main modules."""

from __future__ import annotations

import importlib
import sys
from pathlib import Path
from types import ModuleType
from typing import Optional

from backend.test_client import TestClient


def _normalize_root(package_root: Optional[Path | str]) -> Optional[Path]:
    if package_root is None:
        return None
    return Path(package_root)


def _prepare_package_root(package_root: Optional[Path]) -> None:
    if package_root is None:
        return

    root_str = str(package_root)
    if root_str in sys.path:
        sys.path.remove(root_str)
    sys.path.insert(0, root_str)

    removed_any = False
    for name, module in list(sys.modules.items()):
        if name == "app" or name.startswith("app."):
            module_file = getattr(module, "__file__", "")
            if not module_file or root_str not in module_file:
                sys.modules.pop(name)
                removed_any = True

    if removed_any:
        try:
            from sqlmodel import SQLModel  # type: ignore
        except ModuleNotFoundError:
            return
        SQLModel.metadata.clear()


def reload_main(
    module_path: str = "app.main", *, package_root: Optional[Path | str] = None
) -> ModuleType:
    """Reload and return the module containing the FastAPI application."""

    normalized_root = _normalize_root(package_root)
    _prepare_package_root(normalized_root)

    module = sys.modules.get(module_path)
    if module is None:
        module = importlib.import_module(module_path)
    else:
        module = importlib.reload(module)
    return module


def create_test_client(
    target: ModuleType | str = "app.main", *, package_root: Optional[Path | str] = None
) -> TestClient:
    """Create a :class:`TestClient` from an app module or module path."""

    module = (
        reload_main(target, package_root=package_root)
        if isinstance(target, str)
        else target
    )
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
