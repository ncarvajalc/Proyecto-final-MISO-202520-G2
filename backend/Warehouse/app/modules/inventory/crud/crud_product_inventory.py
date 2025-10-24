from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from ..models.product_inventory_model import ProductInventory
from ..schemas.product_inventory import ProductInventoryCreate, ProductInventoryUpdate


def get_inventory(db: Session, inventory_id: str):
    """Obtiene un registro de inventario por ID"""
    return db.query(ProductInventory).options(
        joinedload(ProductInventory.warehouse)
    ).filter(ProductInventory.id == inventory_id).first()


def get_inventory_by_product_and_warehouse(db: Session, product_id: str, warehouse_id: str):
    """Obtiene inventario de un producto en una bodega específica"""
    return db.query(ProductInventory).filter(
        ProductInventory.product_id == product_id,
        ProductInventory.warehouse_id == warehouse_id
    ).all()


def get_inventory_by_product(db: Session, product_id: str):
    """Obtiene todo el inventario de un producto en todas las bodegas"""
    return db.query(ProductInventory).options(
        joinedload(ProductInventory.warehouse)
    ).filter(ProductInventory.product_id == product_id).all()


def get_inventory_by_warehouse(db: Session, warehouse_id: str, skip: int = 0, limit: int = 10):
    """Obtiene todo el inventario de una bodega"""
    total = db.query(ProductInventory).filter(
        ProductInventory.warehouse_id == warehouse_id
    ).count()
    
    inventory = db.query(ProductInventory).filter(
        ProductInventory.warehouse_id == warehouse_id
    ).offset(skip).limit(limit).all()
    
    return {"inventory": inventory, "total": total}


def get_inventory_all(db: Session, skip: int = 0, limit: int = 10):
    """Obtiene todo el inventario con paginación"""
    total = db.query(ProductInventory).count()
    inventory = db.query(ProductInventory).options(
        joinedload(ProductInventory.warehouse)
    ).offset(skip).limit(limit).all()
    return {"inventory": inventory, "total": total}


def get_inventory_by_batch(db: Session, batch_number: str):
    """Obtiene inventario por número de lote"""
    return db.query(ProductInventory).options(
        joinedload(ProductInventory.warehouse)
    ).filter(ProductInventory.batch_number == batch_number).all()


def create_inventory(db: Session, inventory: ProductInventoryCreate):
    """Crea un nuevo registro de inventario"""
    db_inventory = ProductInventory(**inventory.model_dump())
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory


def update_inventory(db: Session, inventory_id: str, inventory: ProductInventoryUpdate):
    """Actualiza un registro de inventario"""
    db_inventory = db.query(ProductInventory).filter(
        ProductInventory.id == inventory_id
    ).first()
    
    if not db_inventory:
        return None
    
    update_data = inventory.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_inventory, key, value)
    
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory


def delete_inventory(db: Session, inventory_id: str):
    """Elimina un registro de inventario"""
    db_inventory = db.query(ProductInventory).filter(
        ProductInventory.id == inventory_id
    ).first()
    
    if not db_inventory:
        return None
    
    db.delete(db_inventory)
    db.commit()
    return db_inventory


def get_product_total_quantity(db: Session, product_id: str):
    """Obtiene la cantidad total de un producto en todas las bodegas"""
    result = db.query(func.sum(ProductInventory.quantity)).filter(
        ProductInventory.product_id == product_id
    ).scalar()
    return result or 0


def get_warehouse_summary(db: Session, warehouse_id: str):
    """Obtiene resumen del inventario de una bodega"""
    total_products = db.query(func.count(func.distinct(ProductInventory.product_id))).filter(
        ProductInventory.warehouse_id == warehouse_id
    ).scalar()
    
    total_quantity = db.query(func.sum(ProductInventory.quantity)).filter(
        ProductInventory.warehouse_id == warehouse_id
    ).scalar()
    
    storage_types = db.query(
        ProductInventory.storage_type,
        func.count(ProductInventory.id)
    ).filter(
        ProductInventory.warehouse_id == warehouse_id
    ).group_by(ProductInventory.storage_type).all()
    
    return {
        "total_products": total_products or 0,
        "total_quantity": total_quantity or 0,
        "storage_types": {st: count for st, count in storage_types}
    }