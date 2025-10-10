from typing import List
from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..schemas.salespeople import Salespeople, SalespeopleCreate, SalespeopleUpdate
from ..crud.crud_sales_people import get_salespeople_by_email, get_salespeople, create_salespeople, update_salespeople, delete_salespeople, get_salespeople_all

def create(db: Session, salespeople: SalespeopleCreate):
    db_salespeople = get_salespeople_by_email(db, email=salespeople.email)
    if db_salespeople:
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_salespeople(db, salespeople=salespeople)


def read(db: Session, skip: int = 0, limit: int = 100):
    salespeople = get_salespeople_all(db,skip=skip, limit=limit)
    return salespeople

def read_one(db: Session, salespeople_id: str):
    db_salespeople = get_salespeople(db,alespeople_id=salespeople_id)
    if db_salespeople is None:
        raise HTTPException(status_code=404, detail="Salespeople not found")
    return db_salespeople

def update(db: Session, salespeople_id: str, salespeople: SalespeopleUpdate):
    db_salespeople = update_salespeople(db,salespeople_id=salespeople_id, salespeople=salespeople)
    if db_salespeople is None:
        raise HTTPException(status_code=404, detail="Salespeople not found")
    return db_salespeople

def delete(db: Session, salespeople_id: str):
    db_salespeople = delete_salespeople(db, salespeople_id=salespeople_id)
    if db_salespeople is None:
        raise HTTPException(status_code=404, detail="Salespeople not found")
    return db_salespeople