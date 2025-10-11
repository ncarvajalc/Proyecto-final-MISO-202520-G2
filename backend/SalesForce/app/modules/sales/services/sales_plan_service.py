from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.salespeople.models.salespeople_model import Salespeople
from app.modules.sales.crud.sales_plan import (
    create_sales_plan,
    get_sales_plan_by_identifier,
    get_sales_plan_by_vendedor_and_period,
)
from app.modules.sales.schemas import SalesPlan, SalesPlanCreate


def create(db: Session, sales_plan: SalesPlanCreate) -> SalesPlan:
    vendedor = db.query(Salespeople).filter(Salespeople.id == sales_plan.vendedor_id).first()
    if vendedor is None:
        raise HTTPException(status_code=404, detail="Salesperson not found")

    if get_sales_plan_by_identifier(db, sales_plan.identificador):
        raise HTTPException(status_code=400, detail="Identificador already exists")

    if get_sales_plan_by_vendedor_and_period(
        db, sales_plan.vendedor_id, sales_plan.periodo
    ):
        raise HTTPException(
            status_code=400,
            detail="Salesperson already has a plan for this period",
        )

    created = create_sales_plan(db, sales_plan)
    return SalesPlan.model_validate(created)
