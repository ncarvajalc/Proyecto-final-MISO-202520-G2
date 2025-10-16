from fastapi import HTTPException
from sqlalchemy.orm import Session
import math

from ..crud.crud_sales_people import (
    create_salespeople,
    delete_salespeople,
    get_salespeople,
    get_salespeople_all,
    get_salespeople_by_email,
    update_salespeople,
    get_salespeople_with_plans,
)
from ..schemas.salespeople import SalespeopleCreate, SalespeopleUpdate

def create(db: Session, salespeople: SalespeopleCreate):
    db_salespeople = get_salespeople_by_email(db, email=salespeople.email)
    if db_salespeople:
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_salespeople(db, salespeople=salespeople)


def read(db: Session, page: int = 1, limit: int = 10):
    skip = (page - 1) * limit
    result = get_salespeople_all(db, skip=skip, limit=limit)
    total = result["total"]
    salespeople = result["salespeople"]
    total_pages = math.ceil(total / limit)
    
    return {
        "data": salespeople,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }

def read_one(db: Session, salespeople_id: str):
    """Obtiene un vendedor con sus planes de venta cargados"""
    db_salespeople = get_salespeople_with_plans(db, salespeople_id=salespeople_id)
    if db_salespeople is None:
        raise HTTPException(status_code=404, detail="Salespeople not found")
    return db_salespeople

def update(db: Session, salespeople_id: str, salespeople: SalespeopleUpdate):
    db_salespeople = update_salespeople(
        db, salespeople_id=salespeople_id, salespeople=salespeople
    )
    if db_salespeople is None:
        raise HTTPException(status_code=404, detail="Salespeople not found")
    return db_salespeople

def delete(db: Session, salespeople_id: str):
    db_salespeople = delete_salespeople(db, salespeople_id=salespeople_id)
    if db_salespeople is None:
        raise HTTPException(status_code=404, detail="Salespeople not found")
    return db_salespeople