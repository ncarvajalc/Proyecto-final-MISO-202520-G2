from pathlib import Path

from sqlalchemy.exc import OperationalError

from backend.tests.shared_main import (
    assert_health,
    assert_root_message,
    create_test_client,
    reload_main,
)

PACKAGE_ROOT = Path(__file__).resolve().parents[1]


def test_healthcheck_returns_ok():
    module = reload_main(package_root=PACKAGE_ROOT)
    client = create_test_client(module, package_root=PACKAGE_ROOT)

    assert_health(client)


def test_healthcheck_handles_database_errors(monkeypatch):
    module = reload_main(package_root=PACKAGE_ROOT)

    def failing_session():
        raise OperationalError("SELECT 1", {}, Exception("boom"))

    monkeypatch.setattr(module, "SessionLocal", failing_session)
    client = create_test_client(module, package_root=PACKAGE_ROOT)

    assert_health(client, healthy=False)


def test_read_root_returns_welcome_message():
    module = reload_main(package_root=PACKAGE_ROOT)
    client = create_test_client(module, package_root=PACKAGE_ROOT)

    assert_root_message(client)
