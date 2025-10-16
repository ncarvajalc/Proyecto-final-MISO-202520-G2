import math
import os

import pytest
from fastapi import HTTPException
from faker import Faker

from app.modules.salespeople.schemas.salespeople import SalespeopleCreate, SalespeopleUpdate
from app.modules.salespeople.services import salespeople_service as service


def test_service_crud_flow_with_real_database(db_session, fake: Faker):
    create_payload = SalespeopleCreate(
        full_name=fake.name(),
        email=fake.unique.email(),
        hire_date=fake.date_between(start_date="-2y", end_date="today"),
        status=fake.random_element(("active", "inactive")),
    )

    baseline_total = service.read(db_session, page=1, limit=1)["total"]

    created = service.create(db_session, create_payload)
    assert created.id is not None
    assert created.full_name == create_payload.full_name

    paginated = service.read(db_session, page=1, limit=5)
    expected_total = baseline_total + 1
    expected_pages = math.ceil(expected_total / 5)
    assert paginated["total"] == expected_total
    assert paginated["total_pages"] == expected_pages

    fetched = service.read_one(db_session, created.id)
    assert fetched.id == created.id

    new_full_name = fake.name()
    new_status = fake.random_element(("active", "inactive"))
    while new_status == create_payload.status:
        new_status = fake.random_element(("active", "inactive"))

    updated = service.update(
        db_session,
        created.id,
        SalespeopleUpdate(full_name=new_full_name, status=new_status),
    )
    assert updated.full_name == new_full_name
    assert updated.status == new_status

    deleted = service.delete(db_session, created.id)
    assert deleted.id == created.id

    with pytest.raises(HTTPException):
        service.read_one(db_session, created.id)
