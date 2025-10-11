import math
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.salespeople.models.salespeople_model import Salespeople
from app.modules.sales.crud.sales_plan import (
    create_sales_plan,
    get_sales_plan_by_identifier,
    get_sales_plan_by_vendedor_and_period,
    list_sales_plans_paginated,
)
from app.modules.sales.schemas import SalesPlan, SalesPlanCreate, SalesPlanPaginated


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


def list_sales_plans(db: Session, page: int = 1, limit: int = 10) -> SalesPlanPaginated:
    if page < 1 or limit < 1:
        raise HTTPException(status_code=400, detail="page and limit must be greater than zero")

    skip = (page - 1) * limit
    result = list_sales_plans_paginated(db, skip=skip, limit=limit)

    total = result["total"]
    sales_plans = [
        SalesPlan.model_validate(item) for item in result["items"]
    ]

    total_pages = math.ceil(total / limit) if total else 0

    return SalesPlanPaginated(
        data=sales_plans,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )
