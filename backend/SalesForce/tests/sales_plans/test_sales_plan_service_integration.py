import os
from datetime import date

import pytest
from fastapi import HTTPException

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


def test_create_sales_plan_persists_and_maps_response(db_session):
    salesperson = Salespeople(
        full_name="Laura Ramírez",
        email="laura.ramirez@example.com",
        hire_date=date(2024, 1, 1),
        status="active",
    )
    db_session.add(salesperson)
    db_session.commit()

    payload = SalesPlanCreate(
        identificador="PV-2025-Q1",
        nombre="Plan Q1",
        descripcion="Plan del primer trimestre",
        periodo="2025-Q1",
        meta=120.0,
        vendedorId=salesperson.id,
    )

    created = service.create(db_session, payload)

    assert created.id is not None
    assert created.identificador == payload.identificador
    response_payload = created.model_dump(by_alias=True)
    assert response_payload["vendedorId"] == salesperson.id
    assert response_payload["vendedorNombre"] == "Laura Ramírez"
    assert response_payload["unidadesVendidas"] == 0.0

    stored = db_session.query(Salespeople).filter_by(id=salesperson.id).first()
    assert len(stored.sales_plans) == 1
    assert stored.sales_plans[0].identificador == payload.identificador


def test_create_sales_plan_prevents_duplicates(db_session):
    salesperson = Salespeople(
        full_name="Carlos Pérez",
        email="carlos.perez@example.com",
        hire_date=date(2024, 2, 1),
        status="active",
    )
    db_session.add(salesperson)
    db_session.commit()

    base_payload = {
        "identificador": "PV-2025-Q2",
        "nombre": "Plan Q2",
        "descripcion": "Plan del segundo trimestre",
        "periodo": "2025-Q2",
        "meta": 140.0,
        "vendedorId": salesperson.id,
    }

    first = service.create(db_session, SalesPlanCreate(**base_payload))
    assert first.id is not None

    with pytest.raises(HTTPException) as duplicate_identifier:
        service.create(
            db_session,
            SalesPlanCreate(**{**base_payload, "periodo": "2025-Q3"}),
        )

    assert duplicate_identifier.value.status_code == 400

    with pytest.raises(HTTPException) as duplicate_period:
        service.create(
            db_session,
            SalesPlanCreate(**{**base_payload, "identificador": "PV-2025-Q3"}),
        )

    assert duplicate_period.value.status_code == 400


def test_list_sales_plans_returns_paginated_response(db_session):
    salesperson = Salespeople(
        full_name="Sofía Herrera",
        email="sofia.herrera@example.com",
        hire_date=date(2024, 3, 1),
        status="active",
    )
    db_session.add(salesperson)
    db_session.commit()

    for idx in range(3):
        payload = SalesPlanCreate(
            identificador=f"PV-2025-Q{idx + 1}",
            nombre=f"Plan Q{idx + 1}",
            descripcion=f"Plan del trimestre {idx + 1}",
            periodo=f"2025-Q{idx + 1}",
            meta=150 + idx,
            vendedorId=salesperson.id,
        )
        service.create(db_session, payload)

    first_page = service.list_sales_plans(db_session, page=1, limit=2)
    assert first_page.total == 3
    assert first_page.total_pages == 2
    assert len(first_page.data) == 2
    assert all(plan.vendedor_nombre == "Sofía Herrera" for plan in first_page.data)

    second_page = service.list_sales_plans(db_session, page=2, limit=2)
    assert second_page.page == 2
    assert len(second_page.data) == 1
