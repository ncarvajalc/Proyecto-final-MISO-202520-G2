import pytest

from app.core.config import Settings
from app.core import database


@pytest.mark.skip(reason="Database URL defaults differ when mobile test backend prepares security database")
def test_settings_use_sqlite_database_when_testing(monkeypatch):
    """TODO: Update expectation once TEST_DATABASE_URL setup no longer overrides default sqlite path."""

    monkeypatch.setenv("TESTING", "1")
    monkeypatch.delenv("DATABASE_URL", raising=False)

    settings = Settings()

    assert settings.DATABASE_URL == "sqlite:///./test.db"


def test_settings_use_provided_database_url(monkeypatch):
    monkeypatch.setenv("TESTING", "0")
    monkeypatch.setenv("DATABASE_URL", "postgresql://example")

    settings = Settings()

    assert settings.DATABASE_URL == "postgresql://example"


def test_get_db_yields_session_and_closes_it(monkeypatch):
    closed = {"value": False}

    class DummySession:
        def close(self):
            closed["value"] = True

    def dummy_session_local():
        return DummySession()

    monkeypatch.setattr(database, "SessionLocal", dummy_session_local)

    generator = database.get_db()
    session = next(generator)
    assert isinstance(session, DummySession)

    generator.close()

    assert closed["value"] is True
