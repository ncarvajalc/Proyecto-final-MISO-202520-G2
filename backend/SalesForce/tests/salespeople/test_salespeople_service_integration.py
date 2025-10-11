import os
from datetime import date

import pytest
from fastapi import HTTPException

os.environ.setdefault("TESTING", "1")

from app.core.database import Base, SessionLocal, engine
from app.modules.salespeople.schemas.salespeople import SalespeopleCreate, SalespeopleUpdate
from app.modules.salespeople.services import salespeople_service as service


@pytest.fixture(autouse=True)
def prepare_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_service_crud_flow_with_real_database(db_session):
    create_payload = SalespeopleCreate(
        full_name="Laura Ramírez",
        email="laura.ramirez@example.com",
        hire_date=date(2024, 2, 1),
        status="active",
    )

    created = service.create(db_session, create_payload)
    assert created.id is not None
    assert created.full_name == "Laura Ramírez"

    paginated = service.read(db_session, page=1, limit=5)
    assert paginated["total"] == 1
    assert paginated["data"][0].email == "laura.ramirez@example.com"

    fetched = service.read_one(db_session, created.id)
    assert fetched.id == created.id

    updated = service.update(
        db_session,
        created.id,
        SalespeopleUpdate(full_name="Laura Gómez", status="inactive"),
    )
    assert updated.full_name == "Laura Gómez"
    assert updated.status == "inactive"

    deleted = service.delete(db_session, created.id)
    assert deleted.id == created.id

    with pytest.raises(HTTPException):
        service.read_one(db_session, created.id)
