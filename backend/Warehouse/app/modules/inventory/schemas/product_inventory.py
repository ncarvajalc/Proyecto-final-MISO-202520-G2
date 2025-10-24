from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


class ProductInventoryBase(BaseModel):
    warehouse_id: str
    product_id: str
    batch_number: str
    quantity: int = Field(ge=0, description="Cantidad debe ser mayor o igual a 0")
    storage_type: str = Field(..., description="Tipo: general, cold, ultra-cold")
    capacity: Optional[int] = Field(None, ge=0)
    expiration_date: Optional[date] = None


class ProductInventoryCreate(ProductInventoryBase):
    pass


class ProductInventoryUpdate(BaseModel):
    warehouse_id: Optional[str] = None
    product_id: Optional[str] = None
    batch_number: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=0)
    storage_type: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=0)
    expiration_date: Optional[date] = None


class ProductInventory(ProductInventoryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductInventoryWithWarehouse(ProductInventory):
    """Inventario con información de la bodega"""
    warehouse: dict  # Información básica de la bodega

    class Config:
        from_attributes = True


class ProductInventoryPaginated(BaseModel):
    data: List[ProductInventory]
    total: int
    page: int
    limit: int
    total_pages: int


class InventorySummary(BaseModel):
    """Resumen de inventario por producto"""
    product_id: str
    total_quantity: int
    warehouses_count: int
    storage_types: List[str]


class WarehouseInventorySummary(BaseModel):
    """Resumen de inventario de una bodega"""
    warehouse_id: str
    warehouse_name: str
    total_products: int
    total_quantity: int
    storage_types: dict