from faker import Faker
from sqlalchemy.exc import OperationalError

from backend.tests.shared_main import (
    assert_health,
    assert_root_message,
    create_test_client,
    reload_main,
)


def test_healthcheck_reports_database_status():
    module = reload_main()
    client = create_test_client(module)

    assert_health(client)


def test_healthcheck_reports_failure(monkeypatch, fake: Faker):
    module = reload_main()

    def failing_session():
        raise OperationalError("SELECT 1", {}, Exception(fake.word()))

    monkeypatch.setattr(module, "SessionLocal", failing_session)
    client = create_test_client(module)

    assert_health(client, healthy=False)


def test_root_returns_default_message():
    module = reload_main()
    client = create_test_client(module)

    assert_root_message(client)
