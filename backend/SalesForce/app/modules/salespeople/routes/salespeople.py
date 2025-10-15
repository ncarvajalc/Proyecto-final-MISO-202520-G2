from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from ..schemas.salespeople import (
    Salespeople, 
    SalespeopleCreate, 
    SalespeopleUpdate, 
    SalespersonPaginated,
    SalespeopleWithGoals
)
from ..services.salespeople_service import create, read, read_one, update, delete

router = APIRouter(prefix="/vendedores", tags=["vendedores"])


@router.post("/", response_model=Salespeople)
def create_salespeople(salespeople: SalespeopleCreate, db: Session = Depends(get_db)):
    """Crea un nuevo vendedor"""
    return create(db, salespeople)


@router.get("/", response_model=SalespersonPaginated)
def read_salespeople(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    """Lista todos los vendedores con paginación"""
    return read(db, page=page, limit=limit)


@router.get("/{salespeople_id}", response_model=SalespeopleWithGoals)
def read_salespeople_detail(salespeople_id: str, db: Session = Depends(get_db)):
    """
    Obtiene un vendedor específico con sus planes de ventas y objetivos asociados
    """
    return read_one(db, salespeople_id=salespeople_id)


@router.put("/{salespeople_id}", response_model=Salespeople)
def update_salespeople(
    salespeople_id: str, 
    salespeople: SalespeopleUpdate, 
    db: Session = Depends(get_db)
):
    """Actualiza un vendedor"""
    return update(db, salespeople_id=salespeople_id, salespeople=salespeople)


@router.delete("/{salespeople_id}", response_model=Salespeople)
def delete_salespeople(salespeople_id: str, db: Session = Depends(get_db)):
    """Elimina un vendedor"""
    return delete(db, salespeople_id=salespeople_id)