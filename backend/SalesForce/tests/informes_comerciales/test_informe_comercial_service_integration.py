"""Integration tests for Informe Comercial service with real database."""

import math

import pytest
from faker import Faker

from app.modules.reports.schemas import InformeComercialCreate
from app.modules.reports.services import informe_comercial_service as service
from app.modules.reports.models import InformeComercial
from app.modules.salespeople.models.salespeople_model import Salespeople, SalesPlan


def test_create_informe_persists_and_maps_response(db_session, fake: Faker):
    """Test that creating an informe persists to database and returns correct schema."""
    nombre = fake.catch_phrase()
    payload = InformeComercialCreate(nombre=nombre)

    created = service.create(db_session, payload)

    assert created.id is not None
    assert created.nombre == nombre
    assert created.fecha is not None
    assert created.ventas_totales >= 0
    assert created.unidades_vendidas >= 0

    # Verify it was persisted
    stored = db_session.query(InformeComercial).filter_by(id=created.id).first()
    assert stored is not None
    assert stored.nombre == nombre
    assert stored.ventas_totales == created.ventas_totales
    assert stored.unidades_vendidas == created.unidades_vendidas


def test_create_informe_calculates_indicators_from_sales_plans(db_session, fake: Faker):
    """Test that indicators are calculated from existing sales plan data."""
    # Create a salesperson and sales plan
    salesperson = Salespeople(
        full_name=fake.name(),
        email=fake.unique.email(),
        hire_date=fake.date_between(start_date="-2y", end_date="today"),
        status="active",
    )
    db_session.add(salesperson)
    db_session.commit()

    meta_value = 1000.0
    unidades_value = 50.0

    sales_plan = SalesPlan(
        identificador=fake.unique.bothify(text="PV-####-Q#"),
        nombre=fake.catch_phrase(),
        descripcion=fake.text(max_nb_chars=60),
        periodo=f"{fake.random_int(min=2020, max=2030)}-Q{fake.random_int(min=1, max=4)}",
        meta=meta_value,
        vendedor_id=salesperson.id,
        unidades_vendidas=unidades_value,
    )
    db_session.add(sales_plan)
    db_session.commit()

    # Create informe
    payload = InformeComercialCreate(nombre="Test Informe")
    created = service.create(db_session, payload)

    # Indicators should reflect the sales plan data
    assert created.ventas_totales >= meta_value
    assert created.unidades_vendidas >= unidades_value


def test_list_informes_returns_paginated_response(db_session, fake: Faker):
    """Test that list service returns correctly paginated results."""
    # Get baseline count
    baseline_total = service.list_informes_comerciales(
        db_session, page=1, limit=1
    ).total

    # Create 3 informes
    for _ in range(3):
        payload = InformeComercialCreate(nombre=fake.catch_phrase())
        service.create(db_session, payload)

    # Test first page
    first_page = service.list_informes_comerciales(db_session, page=1, limit=2)
    expected_total = baseline_total + 3
    expected_pages = math.ceil(expected_total / 2)

    assert first_page.total == expected_total
    assert first_page.total_pages == expected_pages
    assert len(first_page.data) == min(2, expected_total)
    assert all(informe.nombre for informe in first_page.data)

    # Test second page
    second_page = service.list_informes_comerciales(db_session, page=2, limit=2)
    assert second_page.page == 2
    assert 0 < len(second_page.data) <= 2

    # Verify pagination doesn't return duplicates
    first_ids = {informe.id for informe in first_page.data}
    second_ids = {informe.id for informe in second_page.data}
    assert not first_ids.intersection(second_ids)


def test_list_informes_ordered_by_fecha_desc(db_session, fake: Faker):
    """Test that informes are returned ordered by fecha descending (newest first)."""
    # Create multiple informes
    created_ids = []
    for _ in range(3):
        payload = InformeComercialCreate(nombre=fake.catch_phrase())
        created = service.create(db_session, payload)
        created_ids.append(created.id)
        # Small delay simulation would go here in real scenario

    # Get the list
    result = service.list_informes_comerciales(db_session, page=1, limit=10)

    # Verify ordering (newest first)
    assert len(result.data) >= 3
    for i in range(len(result.data) - 1):
        current_date = result.data[i].fecha
        next_date = result.data[i + 1].fecha
        assert (
            current_date >= next_date
        ), "Informes should be ordered by fecha descending"


def test_list_informes_with_no_data(db_session):
    """Test that list service handles empty database correctly."""
    result = service.list_informes_comerciales(db_session, page=1, limit=10)

    assert result.total == 0
    assert result.total_pages == 0
    assert len(result.data) == 0
