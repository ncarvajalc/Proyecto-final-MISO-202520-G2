from sqlalchemy.orm import Session

from app.modules.salespeople.models.salespeople_model import SalesPlan
from app.modules.sales.schemas import SalesPlanCreate


def get_sales_plan_by_identifier(db: Session, identificador: str):
    return (
        db.query(SalesPlan)
        .filter(SalesPlan.identificador == identificador)
        .first()
    )


def get_sales_plan_by_vendedor_and_period(
    db: Session, vendedor_id: str, periodo: str
):
    return (
        db.query(SalesPlan)
        .filter(
            SalesPlan.vendedor_id == vendedor_id,
            SalesPlan.periodo == periodo,
        )
        .first()
    )


def create_sales_plan(db: Session, sales_plan: SalesPlanCreate):
    db_plan = SalesPlan(
        identificador=sales_plan.identificador,
        nombre=sales_plan.nombre,
        descripcion=sales_plan.descripcion,
        periodo=sales_plan.periodo,
        meta=sales_plan.meta,
        vendedor_id=sales_plan.vendedor_id,
        unidades_vendidas=0,
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan
