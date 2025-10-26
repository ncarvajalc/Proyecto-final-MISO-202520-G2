from sqlalchemy.orm import Session
from ..models.warehouse_model import Warehouse
from ..schemas.warehouse import WarehouseCreate, WarehouseUpdate


def get_warehouse(db: Session, warehouse_id: str):
    """Obtiene una bodega por ID"""
    return db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()


def get_warehouse_by_nombre(db: Session, nombre: str):
    """Obtiene una bodega por nombre"""
    return db.query(Warehouse).filter(Warehouse.nombre == nombre).first()


def get_warehouse_all(db: Session, skip: int = 0, limit: int = 10):
    """Obtiene todas las bodegas con paginación"""
    total = db.query(Warehouse).count()
    warehouses = db.query(Warehouse).offset(skip).limit(limit).all()
    return {"warehouses": warehouses, "total": total}


def get_warehouse_simple_list(db: Session):
    """Obtiene todas las bodegas sin paginación (para listados simples)"""
    return db.query(Warehouse).all()


def create_warehouse(db: Session, warehouse: WarehouseCreate):
    """Crea una nueva bodega"""
    db_warehouse = Warehouse(**warehouse.model_dump())
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse


def update_warehouse(db: Session, warehouse_id: str, warehouse: WarehouseUpdate):
    """Actualiza una bodega existente"""
    db_warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not db_warehouse:
        return None
    update_data = warehouse.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_warehouse, key, value)
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse


def delete_warehouse(db: Session, warehouse_id: str):
    """Elimina una bodega"""
    db_warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not db_warehouse:
        return None
    db.delete(db_warehouse)
    db.commit()
    return db_warehouse