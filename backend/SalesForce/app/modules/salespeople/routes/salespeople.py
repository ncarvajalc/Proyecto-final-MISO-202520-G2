from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from ..schemas.salespeople import Salespeople, SalespeopleCreate, SalespeopleUpdate
from ..services.salespeople_service import create, read, read_one, update, delete

router = APIRouter(prefix="/vendedores", tags=["vendedores"])

@router.post("/", response_model=Salespeople)
def create_salespeople(salespeople: SalespeopleCreate, db: Session = Depends(get_db)):
    return create(db, salespeople)

@router.get("/", response_model=List[Salespeople])
def read_salespeople(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return read(db,skip=skip, limit=limit)

@router.get("/{salespeople_id}", response_model=Salespeople)
def read_salespeople(salespeople_id: str, db: Session = Depends(get_db)):
    return read_one(db,salespeople_id=salespeople_id)

@router.put("/{salespeople_id}", response_model=Salespeople)
def update_salespeople(salespeople_id: str, salespeople: SalespeopleUpdate, db: Session = Depends(get_db)):
    return update(db,salespeople_id=salespeople_id, salespeople=salespeople)

@router.delete("/{salespeople_id}", response_model=Salespeople)
def delete_salespeople(salespeople_id: str, db: Session = Depends(get_db)):
    return delete(db,salespeople_id=salespeople_id)