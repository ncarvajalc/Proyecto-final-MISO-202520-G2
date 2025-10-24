from typing import List
from fastapi import HTTPException
from sqlalchemy.orm import Session
import math

from ..schemas.product_inventory import (
    ProductInventory,
    ProductInventoryCreate,
    ProductInventoryUpdate,
    InventorySummary,
    WarehouseInventorySummary
)
from ..crud.crud_product_inventory import (
    get_inventory,
    get_inventory_by_product,
    get_inventory_by_warehouse,
    get_inventory_all,
    get_inventory_by_batch,
    create_inventory,
    update_inventory,
    delete_inventory,
    get_product_total_quantity,
    get_warehouse_summary
)
# IMPORTANTE: Importar desde el módulo warehouse (módulo diferente)
from app.modules.warehouse.crud.crud_warehouse import get_warehouse


def create(db: Session, inventory: ProductInventoryCreate):
    """Crea un nuevo registro de inventario"""
    # Verificar que la bodega existe
    warehouse = get_warehouse(db, inventory.warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    # Validar storage_type
    valid_storage_types = ["general", "cold", "ultra-cold"]
    if inventory.storage_type not in valid_storage_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid storage_type. Must be one of: {', '.join(valid_storage_types)}"
        )
    
    return create_inventory(db, inventory=inventory)


def read(db: Session, page: int = 1, limit: int = 10):
    """Lista todo el inventario con paginación"""
    skip = (page - 1) * limit
    result = get_inventory_all(db, skip=skip, limit=limit)
    total = result["total"]
    inventory = result["inventory"]
    total_pages = math.ceil(total / limit)
    
    return {
        "data": inventory,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }


def read_by_warehouse(db: Session, warehouse_id: str, page: int = 1, limit: int = 10):
    """Lista el inventario de una bodega específica"""
    # Verificar que la bodega existe
    warehouse = get_warehouse(db, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    skip = (page - 1) * limit
    result = get_inventory_by_warehouse(db, warehouse_id=warehouse_id, skip=skip, limit=limit)
    total = result["total"]
    inventory = result["inventory"]
    total_pages = math.ceil(total / limit)
    
    return {
        "data": inventory,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }


def read_by_product(db: Session, product_id: str) -> List[ProductInventory]:
    """Obtiene todo el inventario de un producto"""
    inventory = get_inventory_by_product(db, product_id=product_id)
    return inventory


def read_by_batch(db: Session, batch_number: str) -> List[ProductInventory]:
    """Obtiene inventario por número de lote"""
    inventory = get_inventory_by_batch(db, batch_number=batch_number)
    if not inventory:
        raise HTTPException(status_code=404, detail="Batch not found")
    return inventory


def read_one(db: Session, inventory_id: str):
    """Obtiene un registro de inventario específico"""
    db_inventory = get_inventory(db, inventory_id=inventory_id)
    if db_inventory is None:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    return db_inventory


def update(db: Session, inventory_id: str, inventory: ProductInventoryUpdate):
    """Actualiza un registro de inventario"""
    # Si se actualiza warehouse_id, verificar que existe
    if inventory.warehouse_id:
        warehouse = get_warehouse(db, inventory.warehouse_id)
        if not warehouse:
            raise HTTPException(status_code=404, detail="Warehouse not found")
    
    # Validar storage_type si se proporciona
    if inventory.storage_type:
        valid_storage_types = ["general", "cold", "ultra-cold"]
        if inventory.storage_type not in valid_storage_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid storage_type. Must be one of: {', '.join(valid_storage_types)}"
            )
    
    db_inventory = update_inventory(db, inventory_id=inventory_id, inventory=inventory)
    if db_inventory is None:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    return db_inventory


def delete(db: Session, inventory_id: str):
    """Elimina un registro de inventario"""
    db_inventory = delete_inventory(db, inventory_id=inventory_id)
    if db_inventory is None:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    return db_inventory


def get_product_summary(db: Session, product_id: str) -> InventorySummary:
    """Obtiene resumen del inventario de un producto"""
    inventory_list = get_inventory_by_product(db, product_id=product_id)
    
    if not inventory_list:
        raise HTTPException(status_code=404, detail="Product not found in inventory")
    
    total_quantity = sum(inv.quantity for inv in inventory_list)
    warehouses_count = len(set(inv.warehouse_id for inv in inventory_list))
    storage_types = list(set(inv.storage_type for inv in inventory_list))
    
    return InventorySummary(
        product_id=product_id,
        total_quantity=total_quantity,
        warehouses_count=warehouses_count,
        storage_types=storage_types
    )


def get_warehouse_inventory_summary(db: Session, warehouse_id: str) -> WarehouseInventorySummary:
    """Obtiene resumen del inventario de una bodega"""
    warehouse = get_warehouse(db, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    summary = get_warehouse_summary(db, warehouse_id=warehouse_id)
    
    return WarehouseInventorySummary(
        warehouse_id=warehouse_id,
        warehouse_name=warehouse.nombre,
        total_products=summary["total_products"],
        total_quantity=summary["total_quantity"],
        storage_types=summary["storage_types"]
    )