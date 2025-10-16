"""Service helpers for sales plan management by salespeople."""

from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.pagination import build_pagination_metadata, get_pagination_offset
from ..schemas.salesplan import SalesPlanCreate, SalesPlanUpdate
from ..schemas.salespeoplegoal import SalespeopleGoalCreate
from ..crud.crud_sales_plan import (
    get_salesplan_by_name,
    get_salesplan,
    create_salesplan,
    update_salesplan,
    delete_salesplan,
    get_salesplan_all,
)
from ..crud.crud_salespeople_goal import create_salespeople_goal
from ..crud.crud_sales_people import get_salespeople


def create(
    db: Session,
    salesplan: SalesPlanCreate,
    salespeople_ids: List[str],
    goal_values: List[float],
):
    """Crear un plan de ventas y asignar objetivos a los vendedores especificados."""

    if len(salespeople_ids) != len(goal_values):
        raise HTTPException(
            status_code=400,
            detail="La cantidad de vendedores debe coincidir con la cantidad de objetivos",
        )

    db_salesplan = get_salesplan_by_name(db, plan_name=salesplan.plan_name)
    if db_salesplan:
        raise HTTPException(status_code=400, detail="Plan name already registered")

    for salespeople_id in salespeople_ids:
        if not get_salespeople(db, salespeople_id):
            raise HTTPException(
                status_code=404,
                detail=f"Vendedor con ID {salespeople_id} no encontrado",
            )

    db_salesplan = create_salesplan(db, salesplan=salesplan)

    for salespeople_id, goal_value in zip(salespeople_ids, goal_values):
        goal_data = SalespeopleGoalCreate(
            sales_plan_id=db_salesplan.id,
            salespeople_id=salespeople_id,
            goal_value=goal_value,
        )
        create_salespeople_goal(db, goal=goal_data)

    return db_salesplan


def read(db: Session, page: int = 1, limit: int = 10):
    skip = get_pagination_offset(page, limit)
    result = get_salesplan_all(db, skip=skip, limit=limit)
    total = result["total"]
    salesplans = result["salesplans"]
    metadata = build_pagination_metadata(total=total, page=page, limit=limit)

    return {"data": salesplans, **metadata}


def read_one(db: Session, salesplan_id: str):
    db_salesplan = get_salesplan(db, salesplan_id=salesplan_id)
    if db_salesplan is None:
        raise HTTPException(status_code=404, detail="Sales plan not found")
    return db_salesplan


def update(db: Session, salesplan_id: str, salesplan: SalesPlanUpdate):
    db_salesplan = update_salesplan(db, salesplan_id=salesplan_id, salesplan=salesplan)
    if db_salesplan is None:
        raise HTTPException(status_code=404, detail="Sales plan not found")
    return db_salesplan


def delete(db: Session, salesplan_id: str):
    db_salesplan = delete_salesplan(db, salesplan_id=salesplan_id)
    if db_salesplan is None:
        raise HTTPException(status_code=404, detail="Sales plan not found")
    return db_salesplan
