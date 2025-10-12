import os

import pytest
from fastapi import HTTPException
from faker import Faker

os.environ.setdefault("TESTING", "1")

from app.core.database import Base, SessionLocal, engine
from app.modules.sales.schemas import SalesPlanCreate
from app.modules.sales.services import sales_plan_service as service
from app.modules.salespeople.models.salespeople_model import Salespeople


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


def test_create_sales_plan_persists_and_maps_response(db_session, fake: Faker):
    salesperson = Salespeople(
        full_name=fake.name(),
        email=fake.unique.email(),
        hire_date=fake.date_between(start_date="-2y", end_date="today"),
        status=fake.random_element(("active", "inactive")),
    )
    db_session.add(salesperson)
    db_session.commit()

    identifier = fake.unique.bothify(text="PV-####-Q#")
    payload = SalesPlanCreate(
        identificador=identifier,
        nombre=fake.catch_phrase(),
        descripcion=fake.text(max_nb_chars=60),
        periodo=f"{fake.random_int(min=2020, max=2030)}-Q{fake.random_int(min=1, max=4)}",
        meta=float(round(fake.pyfloat(min_value=50, max_value=500, right_digits=2), 2)),
        vendedorId=salesperson.id,
    )

    created = service.create(db_session, payload)

    assert created.id is not None
    assert created.identificador == identifier
    response_payload = created.model_dump(by_alias=True)
    assert response_payload["vendedorId"] == salesperson.id
    assert response_payload["vendedorNombre"] == salesperson.full_name
    assert response_payload["unidadesVendidas"] == 0.0

    stored = db_session.query(Salespeople).filter_by(id=salesperson.id).first()
    assert len(stored.sales_plans) == 1
    assert stored.sales_plans[0].identificador == payload.identificador


def test_create_sales_plan_prevents_duplicates(db_session, fake: Faker):
    salesperson = Salespeople(
        full_name=fake.name(),
        email=fake.unique.email(),
        hire_date=fake.date_between(start_date="-2y", end_date="today"),
        status=fake.random_element(("active", "inactive")),
    )
    db_session.add(salesperson)
    db_session.commit()

    base_identifier = fake.unique.bothify(text="PV-####-Q#")
    base_period = f"{fake.random_int(min=2020, max=2030)}-Q{fake.random_int(min=1, max=4)}"
    base_payload = {
        "identificador": base_identifier,
        "nombre": fake.catch_phrase(),
        "descripcion": fake.text(max_nb_chars=60),
        "periodo": base_period,
        "meta": float(round(fake.pyfloat(min_value=50, max_value=500, right_digits=2), 2)),
        "vendedorId": salesperson.id,
    }

    first = service.create(db_session, SalesPlanCreate(**base_payload))
    assert first.id is not None

    other_period = f"{fake.random_int(min=2020, max=2030)}-Q{fake.random_int(min=1, max=4)}"
    while other_period == base_payload["periodo"]:
        other_period = f"{fake.random_int(min=2020, max=2030)}-Q{fake.random_int(min=1, max=4)}"

    with pytest.raises(HTTPException) as duplicate_identifier:
        service.create(
            db_session,
            SalesPlanCreate(**{**base_payload, "periodo": other_period}),
        )

    assert duplicate_identifier.value.status_code == 400

    other_identifier = fake.unique.bothify(text="PV-####-Q#")

    with pytest.raises(HTTPException) as duplicate_period:
        service.create(
            db_session,
            SalesPlanCreate(**{**base_payload, "identificador": other_identifier}),
        )

    assert duplicate_period.value.status_code == 400


def test_list_sales_plans_returns_paginated_response(db_session, fake: Faker):
    salesperson = Salespeople(
        full_name=fake.name(),
        email=fake.unique.email(),
        hire_date=fake.date_between(start_date="-2y", end_date="today"),
        status=fake.random_element(("active", "inactive")),
    )
    db_session.add(salesperson)
    db_session.commit()

    for idx in range(3):
        payload = SalesPlanCreate(
            identificador=fake.unique.bothify(text="PV-####-Q#"),
            nombre=fake.catch_phrase(),
            descripcion=fake.text(max_nb_chars=60),
            periodo=f"{fake.random_int(min=2020, max=2030)}-Q{fake.random_int(min=1, max=4)}",
            meta=float(round(fake.pyfloat(min_value=50, max_value=500, right_digits=2), 2)),
            vendedorId=salesperson.id,
        )
        service.create(db_session, payload)

    first_page = service.list_sales_plans(db_session, page=1, limit=2)
    assert first_page.total == 3
    assert first_page.total_pages == 2
    assert len(first_page.data) == 2
    assert all(plan.vendedor_nombre == salesperson.full_name for plan in first_page.data)

    second_page = service.list_sales_plans(db_session, page=2, limit=2)
    assert second_page.page == 2
    assert len(second_page.data) == 1
