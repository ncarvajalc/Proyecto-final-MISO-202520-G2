from typing import List
from fastapi import HTTPException
from sqlalchemy.orm import Session
import math

from ..schemas.warehouse import Warehouse, WarehouseCreate, WarehouseUpdate, WarehouseSimple
from ..crud.crud_warehouse import (
    get_warehouse_by_nombre,
    get_warehouse,
    create_warehouse,
    update_warehouse,
    delete_warehouse,
    get_warehouse_all,
    get_warehouse_simple_list
)


def create(db: Session, warehouse: WarehouseCreate):
    """Crea una nueva bodega"""
    db_warehouse = get_warehouse_by_nombre(db, nombre=warehouse.nombre)
    if db_warehouse:
        raise HTTPException(status_code=400, detail="Warehouse name already registered")
    return create_warehouse(db, warehouse=warehouse)


def read(db: Session, page: int = 1, limit: int = 10):
    """Lista todas las bodegas con paginación"""
    skip = (page - 1) * limit
    result = get_warehouse_all(db, skip=skip, limit=limit)
    total = result["total"]
    warehouses = result["warehouses"]
    total_pages = math.ceil(total / limit)
    
    return {
        "data": warehouses,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }


def read_simple(db: Session) -> List[WarehouseSimple]:
    """Lista todas las bodegas sin paginación (formato simple)"""
    warehouses = get_warehouse_simple_list(db)
    return [
        WarehouseSimple(
            id=w.id,
            nombre=w.nombre,
            ubicacion=w.ubicacion
        )
        for w in warehouses
    ]


def read_one(db: Session, warehouse_id: str):
    """Obtiene una bodega específica"""
    db_warehouse = get_warehouse(db, warehouse_id=warehouse_id)
    if db_warehouse is None:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return db_warehouse


def update(db: Session, warehouse_id: str, warehouse: WarehouseUpdate):
    """Actualiza una bodega"""
    db_warehouse = update_warehouse(db, warehouse_id=warehouse_id, warehouse=warehouse)
    if db_warehouse is None:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return db_warehouse


def delete(db: Session, warehouse_id: str):
    """Elimina una bodega"""
    db_warehouse = delete_warehouse(db, warehouse_id=warehouse_id)
    if db_warehouse is None:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return db_warehouse