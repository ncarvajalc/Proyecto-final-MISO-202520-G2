from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from ..schemas.warehouse import (
    Warehouse,
    WarehouseCreate,
    WarehouseUpdate,
    WarehousePaginated,
    WarehouseSimple
)
from ..services.warehouse_service import create, read, read_simple, read_one, update, delete

router = APIRouter(prefix="/bodegas", tags=["bodegas"])


@router.post("/", response_model=Warehouse, status_code=201)
def create_warehouse(warehouse: WarehouseCreate, db: Session = Depends(get_db)):
    """
    Crea una nueva bodega
    
    Example body:
    ```json
    {
        "nombre": "Bogotá-1",
        "ubicacion": "Bogotá"
    }
    ```
    """
    return create(db, warehouse)


@router.get("/", response_model=List[WarehouseSimple])
def read_warehouses(
    simple: bool = Query(True, description="Si es True, retorna formato simple sin paginación"),
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(10, ge=1, le=100, description="Items por página"),
    db: Session = Depends(get_db)
):
    """
    Lista todas las bodegas.
    
    Por defecto retorna formato simple sin paginación:
    ```json
    [
      {
        "id": "1",
        "nombre": "Bogotá-1",
        "ubicacion": "Bogotá"
      }
    ]
    ```
    
    Con `simple=false` retorna formato paginado con metadata.
    """
    if simple:
        return read_simple(db)
    else:
        return read(db, page=page, limit=limit)


@router.get("/paginated", response_model=WarehousePaginated)
def read_warehouses_paginated(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Lista todas las bodegas con paginación y metadata
    
    Response:
    ```json
    {
        "data": [...],
        "total": 10,
        "page": 1,
        "limit": 10,
        "total_pages": 1
    }
    ```
    """
    return read(db, page=page, limit=limit)


@router.get("/{warehouse_id}", response_model=Warehouse)
def read_warehouse_detail(warehouse_id: str, db: Session = Depends(get_db)):
    """
    Obtiene una bodega específica por ID
    """
    return read_one(db, warehouse_id=warehouse_id)


@router.put("/{warehouse_id}", response_model=Warehouse)
def update_warehouse(
    warehouse_id: str,
    warehouse: WarehouseUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualiza una bodega existente
    """
    return update(db, warehouse_id=warehouse_id, warehouse=warehouse)


@router.delete("/{warehouse_id}", response_model=Warehouse)
def delete_warehouse(warehouse_id: str, db: Session = Depends(get_db)):
    """
    Elimina una bodega
    """
    return delete(db, warehouse_id=warehouse_id)