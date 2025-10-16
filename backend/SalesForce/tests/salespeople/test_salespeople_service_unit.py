import pytest
from fastapi import HTTPException
from faker import Faker

from app.core.pagination import build_pagination_metadata, get_pagination_offset
from app.modules.salespeople.schemas.salespeople import SalespeopleCreate, SalespeopleUpdate
from app.modules.salespeople.services import salespeople_service as service


@pytest.fixture()
def sample_salesperson(fake: Faker):
    hire_date = fake.date_between(start_date="-2y", end_date="today")
    return SalespeopleCreate(
        full_name=fake.name(),
        email=fake.unique.email(),
        hire_date=hire_date,
        status=fake.random_element(("active", "inactive")),
    )


def test_create_salespeople_raises_when_email_exists(
    monkeypatch, sample_salesperson: SalespeopleCreate
):
    db = object()

    def fake_get_salespeople_by_email(db_session, email):
        assert db_session is db
        assert email == sample_salesperson.email
        return object()

    create_called = False

    def fake_create_salespeople(db_session, salespeople):
        nonlocal create_called
        create_called = True
        return None

    monkeypatch.setattr(
        service, "get_salespeople_by_email", fake_get_salespeople_by_email
    )
    monkeypatch.setattr(service, "create_salespeople", fake_create_salespeople)

    with pytest.raises(HTTPException) as exc_info:
        service.create(db, sample_salesperson)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Email already registered"
    assert create_called is False


def test_create_salespeople_calls_crud_when_email_free(
    monkeypatch, sample_salesperson: SalespeopleCreate
):
    db = object()
    created = object()

    monkeypatch.setattr(service, "get_salespeople_by_email", lambda db, email: None)
    monkeypatch.setattr(
        service, "create_salespeople", lambda db_session, salespeople: created
    )

    result = service.create(db, sample_salesperson)

    assert result is created


def test_read_salespeople_returns_paginated_structure(monkeypatch):
    db = object()
    salesperson = object()

    def fake_get_all(db_session, skip, limit):
        assert db_session is db
        assert skip == 10
        assert limit == 10
        return {"salespeople": [salesperson], "total": 15}

    monkeypatch.setattr(service, "get_salespeople_all", fake_get_all)

    response = service.read(db, page=2, limit=10)

    assert response == {
        "data": [salesperson],
        "total": 15,
        "page": 2,
        "limit": 10,
        "total_pages": 2,
    }


def test_read_one_salespeople_raises_when_not_found(monkeypatch):
    db = object()

    monkeypatch.setattr(service, "get_salespeople_with_plans", lambda *args, **kwargs: None)

    with pytest.raises(HTTPException) as exc_info:
        service.read_one(db, salespeople_id="missing")

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Salespeople not found"


def test_update_salespeople_raises_when_not_found(monkeypatch, fake: Faker):
    db = object()

    monkeypatch.setattr(service, "update_salespeople", lambda *args, **kwargs: None)

    with pytest.raises(HTTPException):
        service.update(
            db,
            "123",
            SalespeopleUpdate(full_name=fake.name(), status=fake.random_element(("active", "inactive"))),
        )


def test_delete_salespeople_raises_when_not_found(monkeypatch):
    db = object()

    monkeypatch.setattr(service, "delete_salespeople", lambda *args, **kwargs: None)

    with pytest.raises(HTTPException):
        service.delete(db, "123")


def test_get_pagination_offset_enforces_positive_values():
    with pytest.raises(HTTPException):
        get_pagination_offset(page=0, limit=5)


def test_build_pagination_metadata_matches_expected_structure():
    metadata = build_pagination_metadata(total=21, page=2, limit=10)

    assert metadata == {
        "total": 21,
        "page": 2,
        "limit": 10,
        "total_pages": 3,
    }
