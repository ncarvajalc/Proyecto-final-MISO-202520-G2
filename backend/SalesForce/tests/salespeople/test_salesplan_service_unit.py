"""Unit tests for the salesplan service pagination helpers."""

import pytest
from fastapi import HTTPException

from app.core.pagination import build_pagination_metadata, get_pagination_offset
from app.modules.salespeople.services import salesplan_service as service


def test_read_validates_pagination_and_skips_fetch(monkeypatch):
    db = object()
    fetch_called = False

    def fake_fetch(db_session, skip, limit):
        nonlocal fetch_called
        fetch_called = True
        return {"salesplans": [], "total": 0}

    monkeypatch.setattr(service, "get_salesplan_all", fake_fetch)

    with pytest.raises(HTTPException):
        service.read(db, page=0, limit=5)

    assert fetch_called is False


def test_read_returns_expected_metadata(monkeypatch):
    db = object()

    def fake_fetch(db_session, skip, limit):
        assert db_session is db
        assert skip == 10
        assert limit == 5
        return {"salesplans": ["plan"], "total": 11}

    monkeypatch.setattr(service, "get_salesplan_all", fake_fetch)

    result = service.read(db, page=3, limit=5)

    assert result == {
        "data": ["plan"],
        "total": 11,
        "page": 3,
        "limit": 5,
        "total_pages": 3,
    }


def test_helper_functions_match_service_behavior():
    assert get_pagination_offset(page=2, limit=4) == 4

    metadata = build_pagination_metadata(total=12, page=2, limit=4)
    assert metadata == {"total": 12, "page": 2, "limit": 4, "total_pages": 3}
