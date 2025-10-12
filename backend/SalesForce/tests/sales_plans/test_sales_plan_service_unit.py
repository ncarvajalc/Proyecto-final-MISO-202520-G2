import os
from datetime import datetime
from types import SimpleNamespace
import math

import pytest
from fastapi import HTTPException
from faker import Faker

os.environ.setdefault("TESTING", "1")

from app.modules.sales.schemas import SalesPlanCreate
from app.modules.sales.services import sales_plan_service as service


@pytest.fixture()
def sample_payload(fake: Faker):
    period = f"{fake.random_int(min=2020, max=2030)}-Q{fake.random_int(min=1, max=4)}"
    return SalesPlanCreate(
        identificador=fake.unique.bothify(text="PV-####-Q#"),
        nombre=fake.catch_phrase(),
        descripcion=fake.text(max_nb_chars=60),
        periodo=period,
        meta=float(round(fake.pyfloat(min_value=50, max_value=500, right_digits=2), 2)),
        vendedorId=fake.uuid4(),
    )


class DummyQuery:
    def __init__(self, result):
        self._result = result

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self._result


class DummySession:
    def __init__(self, salesperson=None):
        self._salesperson = salesperson

    def query(self, model):
        return DummyQuery(self._salesperson)


def test_create_sales_plan_raises_when_salesperson_missing(sample_payload: SalesPlanCreate):
    db = DummySession(salesperson=None)

    with pytest.raises(HTTPException) as exc_info:
        service.create(db, sample_payload)

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Salesperson not found"


def test_create_sales_plan_rejects_duplicate_identifier(monkeypatch, sample_payload):
    db = DummySession(salesperson=SimpleNamespace(id=sample_payload.vendedor_id))

    monkeypatch.setattr(service, "get_sales_plan_by_identifier", lambda *args, **kwargs: object())

    with pytest.raises(HTTPException) as exc_info:
        service.create(db, sample_payload)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Identificador already exists"


def test_create_sales_plan_rejects_duplicate_period(monkeypatch, sample_payload):
    db = DummySession(salesperson=SimpleNamespace(id=sample_payload.vendedor_id))

    monkeypatch.setattr(service, "get_sales_plan_by_identifier", lambda *args, **kwargs: None)
    monkeypatch.setattr(
        service,
        "get_sales_plan_by_vendedor_and_period",
        lambda *args, **kwargs: object(),
    )

    with pytest.raises(HTTPException) as exc_info:
        service.create(db, sample_payload)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Salesperson already has a plan for this period"


def test_create_sales_plan_returns_valid_schema(
    monkeypatch, sample_payload: SalesPlanCreate, fake: Faker
):
    db = DummySession(salesperson=SimpleNamespace(id=sample_payload.vendedor_id))

    monkeypatch.setattr(service, "get_sales_plan_by_identifier", lambda *args, **kwargs: None)
    monkeypatch.setattr(
        service,
        "get_sales_plan_by_vendedor_and_period",
        lambda *args, **kwargs: None,
    )

    now = datetime.utcnow()
    plan_identifier = fake.uuid4()
    seller_name = fake.name()
    sold_units = float(round(fake.pyfloat(min_value=0, max_value=200, right_digits=2), 2))
    created_plan = SimpleNamespace(
        id=plan_identifier,
        identificador=sample_payload.identificador,
        nombre=sample_payload.nombre,
        descripcion=sample_payload.descripcion,
        periodo=sample_payload.periodo,
        meta=sample_payload.meta,
        vendedor_id=sample_payload.vendedor_id,
        unidades_vendidas=sold_units,
        vendedor_nombre=seller_name,
        created_at=now,
        updated_at=now,
    )

    monkeypatch.setattr(service, "create_sales_plan", lambda *args, **kwargs: created_plan)

    result = service.create(db, sample_payload)

    assert result.id == plan_identifier
    assert result.identificador == sample_payload.identificador
    payload = result.model_dump(by_alias=True)
    assert payload["vendedorId"] == sample_payload.vendedor_id
    assert payload["vendedorNombre"] == seller_name
    assert payload["unidadesVendidas"] == sold_units


def test_list_sales_plans_validates_pagination_arguments():
    db = object()

    with pytest.raises(HTTPException) as exc_info:
        service.list_sales_plans(db, page=0, limit=5)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "page and limit must be greater than zero"


def test_list_sales_plans_maps_orm_objects(monkeypatch, fake: Faker):
    db = object()
    now = datetime.utcnow()
    first_units = float(round(fake.pyfloat(min_value=0, max_value=300, right_digits=2), 2))
    sample_items = [
        SimpleNamespace(
            id=fake.uuid4(),
            identificador=fake.unique.bothify(text="PV-####-Q#"),
            nombre=fake.catch_phrase(),
            descripcion=fake.text(max_nb_chars=60),
            periodo=f"{fake.random_int(min=2020, max=2030)}-Q{fake.random_int(min=1, max=4)}",
            meta=float(round(fake.pyfloat(min_value=50, max_value=500, right_digits=2), 2)),
            vendedor_id=fake.uuid4(),
            unidades_vendidas=first_units,
            vendedor_nombre=fake.name(),
            created_at=now,
            updated_at=now,
        ),
        SimpleNamespace(
            id=fake.uuid4(),
            identificador=fake.unique.bothify(text="PV-####-Q#"),
            nombre=fake.catch_phrase(),
            descripcion=fake.text(max_nb_chars=60),
            periodo=f"{fake.random_int(min=2020, max=2030)}-Q{fake.random_int(min=1, max=4)}",
            meta=float(round(fake.pyfloat(min_value=50, max_value=500, right_digits=2), 2)),
            vendedor_id=fake.uuid4(),
            unidades_vendidas=float(
                round(fake.pyfloat(min_value=0, max_value=300, right_digits=2), 2)
            ),
            vendedor_nombre=None,
            created_at=now,
            updated_at=now,
        ),
    ]

    total_count = fake.random_int(min=3, max=10)

    monkeypatch.setattr(
        service,
        "list_sales_plans_paginated",
        lambda *args, **kwargs: {"items": sample_items, "total": total_count},
    )

    result = service.list_sales_plans(db, page=2, limit=2)

    assert result.total == total_count
    assert result.page == 2
    assert result.limit == 2
    expected_total_pages = math.ceil(total_count / 2)
    assert result.total_pages == expected_total_pages

    payload = result.model_dump(by_alias=True)
    assert payload["totalPages"] == expected_total_pages
    assert len(payload["data"]) == 2
    assert payload["data"][0]["unidadesVendidas"] == first_units
    assert payload["data"][1]["vendedorNombre"] is None
