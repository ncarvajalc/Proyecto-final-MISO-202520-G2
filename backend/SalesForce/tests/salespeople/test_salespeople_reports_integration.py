"""Integration tests for vendor report queries."""

from faker import Faker

from app.modules.salespeople.models.salespeople_model import SalesPlan, Salespeople
from app.modules.salespeople.services import salespeople_service


def test_read_one_returns_salesperson_with_loaded_plan(db_session, fake: Faker):
    """The service should return the salesperson along with their sales plan."""

    salesperson = Salespeople(
        full_name=fake.name(),
        email=fake.unique.email(),
        hire_date=fake.date_between(start_date="-2y", end_date="-1y"),
        status="active",
    )
    db_session.add(salesperson)
    db_session.flush()

    plan = SalesPlan(
        identificador=fake.unique.bothify(text="PV-####-Q#"),
        nombre=fake.catch_phrase(),
        descripcion=fake.text(max_nb_chars=60),
        periodo=f"{fake.random_int(min=2023, max=2025)}-Q{fake.random_int(min=1, max=4)}",
        meta=float(fake.random_int(min=1000, max=10000)),
        unidades_vendidas=float(fake.random_int(min=0, max=500)),
        vendedor_id=salesperson.id,
    )
    db_session.add(plan)
    db_session.commit()

    result = salespeople_service.read_one(db_session, salespeople_id=salesperson.id)

    assert result.id == salesperson.id
    assert result.full_name == salesperson.full_name
    assert len(result.sales_plans) == 1

    loaded_plan = result.sales_plans[0]
    assert loaded_plan.identificador == plan.identificador
    assert loaded_plan.periodo == plan.periodo
    assert loaded_plan.meta == plan.meta
    assert loaded_plan.unidades_vendidas == plan.unidades_vendidas


def test_read_one_returns_empty_plan_list_when_no_assignments(db_session, fake: Faker):
    salesperson = Salespeople(
        full_name=fake.name(),
        email=fake.unique.email(),
        hire_date=fake.date_between(start_date="-1y", end_date="today"),
        status="inactive",
    )
    db_session.add(salesperson)
    db_session.commit()

    result = salespeople_service.read_one(db_session, salespeople_id=salesperson.id)

    assert result.id == salesperson.id
    assert result.sales_plans == []
