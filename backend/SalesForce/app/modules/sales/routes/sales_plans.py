from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.sales.schemas import SalesPlan, SalesPlanCreate, SalesPlanPaginated
from app.modules.sales.services import (
    create as create_sales_plan,
    list_sales_plans,
)

router = APIRouter(prefix="/planes-venta", tags=["planes-venta"])


@router.post("/", response_model=SalesPlan)
def create_sales_plan_endpoint(
    payload: SalesPlanCreate, db: Session = Depends(get_db)
):
    return create_sales_plan(db, payload)


@router.get("/", response_model=SalesPlanPaginated)
def list_sales_plans_endpoint(
    page: int = 1, limit: int = 10, db: Session = Depends(get_db)
):
    return list_sales_plans(db, page=page, limit=limit)
