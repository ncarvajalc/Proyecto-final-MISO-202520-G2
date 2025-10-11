import os
from datetime import datetime
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

os.environ.setdefault("TESTING", "1")

from app.modules.sales.schemas import SalesPlanCreate
from app.modules.sales.services import sales_plan_service as service


@pytest.fixture()
def sample_payload():
    return SalesPlanCreate(
        identificador="PV-2025-Q1",
        nombre="Plan Q1",
        descripcion="Plan primer trimestre",
        periodo="2025-Q1",
        meta=100.0,
        vendedorId="vendor-1",
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


def test_create_sales_plan_raises_when_salesperson_missing(sample_payload):
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


def test_create_sales_plan_returns_valid_schema(monkeypatch, sample_payload):
    db = DummySession(salesperson=SimpleNamespace(id=sample_payload.vendedor_id))

    monkeypatch.setattr(service, "get_sales_plan_by_identifier", lambda *args, **kwargs: None)
    monkeypatch.setattr(
        service,
        "get_sales_plan_by_vendedor_and_period",
        lambda *args, **kwargs: None,
    )

    now = datetime.utcnow()
    created_plan = SimpleNamespace(
        id="plan-1",
        identificador=sample_payload.identificador,
        nombre=sample_payload.nombre,
        descripcion=sample_payload.descripcion,
        periodo=sample_payload.periodo,
        meta=sample_payload.meta,
        vendedor_id=sample_payload.vendedor_id,
        unidades_vendidas=0.0,
        vendedor_nombre="Ana Pérez",
        created_at=now,
        updated_at=now,
    )

    monkeypatch.setattr(service, "create_sales_plan", lambda *args, **kwargs: created_plan)

    result = service.create(db, sample_payload)

    assert result.id == "plan-1"
    assert result.identificador == sample_payload.identificador
    payload = result.model_dump(by_alias=True)
    assert payload["vendedorId"] == sample_payload.vendedor_id
    assert payload["vendedorNombre"] == "Ana Pérez"
    assert payload["unidadesVendidas"] == 0.0


def test_list_sales_plans_validates_pagination_arguments():
    db = object()

    with pytest.raises(HTTPException) as exc_info:
        service.list_sales_plans(db, page=0, limit=5)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "page and limit must be greater than zero"


def test_list_sales_plans_maps_orm_objects(monkeypatch):
    db = object()
    now = datetime.utcnow()

    sample_items = [
        SimpleNamespace(
            id="plan-1",
            identificador="PV-2025-Q1",
            nombre="Plan Q1",
            descripcion="Plan primer trimestre",
            periodo="2025-Q1",
            meta=120.0,
            vendedor_id="vendor-1",
            unidades_vendidas=45.5,
            vendedor_nombre="Laura Ramírez",
            created_at=now,
            updated_at=now,
        ),
        SimpleNamespace(
            id="plan-2",
            identificador="PV-2025-Q2",
            nombre="Plan Q2",
            descripcion="Plan segundo trimestre",
            periodo="2025-Q2",
            meta=130.0,
            vendedor_id="vendor-2",
            unidades_vendidas=10.0,
            vendedor_nombre=None,
            created_at=now,
            updated_at=now,
        ),
    ]

    monkeypatch.setattr(
        service,
        "list_sales_plans_paginated",
        lambda *args, **kwargs: {"items": sample_items, "total": 5},
    )

    result = service.list_sales_plans(db, page=2, limit=2)

    assert result.total == 5
    assert result.page == 2
    assert result.limit == 2
    assert result.total_pages == 3

    payload = result.model_dump(by_alias=True)
    assert payload["totalPages"] == 3
    assert len(payload["data"]) == 2
    assert payload["data"][0]["unidadesVendidas"] == 45.5
    assert payload["data"][1]["vendedorNombre"] is None
