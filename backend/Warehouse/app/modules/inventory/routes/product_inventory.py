from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from ..schemas.product_inventory import (
    ProductInventory,
    ProductInventoryCreate,
    ProductInventoryUpdate,
    ProductInventoryPaginated,
    InventorySummary,
    WarehouseInventorySummary
)
from ..services.product_inventory_service import (
    create,
    read,
    read_by_warehouse,
    read_by_product,
    read_by_batch,
    read_one,
    update,
    delete,
    get_product_summary,
    get_warehouse_inventory_summary
)

router = APIRouter(prefix="/inventario", tags=["inventario"])


@router.post("/", response_model=ProductInventory, status_code=201)
def create_inventory(inventory: ProductInventoryCreate, db: Session = Depends(get_db)):
    """
    Crea un nuevo registro de inventario
    
    Example body:
    ```json
    {
        "warehouse_id": "333e5e21-73e3-4871-a09b-e1204e4f540f",
        "product_id": "md-01",
        "batch_number": "BATCH-001",
        "quantity": 100,
        "storage_type": "cold",
        "capacity": 500,
        "expiration_date": "2025-12-31"
    }
    ```
    
    storage_type: "general", "cold", "ultra-cold"
    """
    return create(db, inventory)


@router.get("/", response_model=ProductInventoryPaginated)
def read_inventory(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Lista todo el inventario con paginación
    """
    return read(db, page=page, limit=limit)


@router.get("/bodega/{warehouse_id}", response_model=ProductInventoryPaginated)
def read_inventory_by_warehouse(
    warehouse_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Lista el inventario de una bodega específica
    """
    return read_by_warehouse(db, warehouse_id=warehouse_id, page=page, limit=limit)


@router.get("/producto/{product_id}", response_model=List[ProductInventory])
def read_inventory_by_product(product_id: str, db: Session = Depends(get_db)):
    """
    Obtiene todo el inventario de un producto en todas las bodegas
    """
    return read_by_product(db, product_id=product_id)


@router.get("/lote/{batch_number}", response_model=List[ProductInventory])
def read_inventory_by_batch(batch_number: str, db: Session = Depends(get_db)):
    """
    Obtiene inventario por número de lote
    """
    return read_by_batch(db, batch_number=batch_number)


@router.get("/producto/{product_id}/resumen", response_model=InventorySummary)
def get_product_inventory_summary(product_id: str, db: Session = Depends(get_db)):
    """
    Obtiene resumen del inventario de un producto
    
    Retorna:
    - Cantidad total
    - Número de bodegas donde está disponible
    - Tipos de almacenamiento utilizados
    """
    return get_product_summary(db, product_id=product_id)


@router.get("/bodega/{warehouse_id}/resumen", response_model=WarehouseInventorySummary)
def get_warehouse_summary_endpoint(warehouse_id: str, db: Session = Depends(get_db)):
    """
    Obtiene resumen del inventario de una bodega
    
    Retorna:
    - Nombre de la bodega
    - Total de productos diferentes
    - Cantidad total de items
    - Distribución por tipo de almacenamiento
    """
    return get_warehouse_inventory_summary(db, warehouse_id=warehouse_id)


@router.get("/{inventory_id}", response_model=ProductInventory)
def read_inventory_detail(inventory_id: str, db: Session = Depends(get_db)):
    """
    Obtiene un registro de inventario específico por ID
    """
    return read_one(db, inventory_id=inventory_id)


@router.put("/{inventory_id}", response_model=ProductInventory)
def update_inventory(
    inventory_id: str,
    inventory: ProductInventoryUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualiza un registro de inventario existente
    """
    return update(db, inventory_id=inventory_id, inventory=inventory)


@router.delete("/{inventory_id}", response_model=ProductInventory)
def delete_inventory(inventory_id: str, db: Session = Depends(get_db)):
    """
    Elimina un registro de inventario
    """
    return delete(db, inventory_id=inventory_id)