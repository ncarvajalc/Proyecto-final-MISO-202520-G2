from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.sales.schemas import SalesPlan, SalesPlanCreate
from app.modules.sales.services import create as create_sales_plan

router = APIRouter(prefix="/planes-venta", tags=["planes-venta"])


@router.post("/", response_model=SalesPlan)
def create_sales_plan_endpoint(
    payload: SalesPlanCreate, db: Session = Depends(get_db)
):
    return create_sales_plan(db, payload)
