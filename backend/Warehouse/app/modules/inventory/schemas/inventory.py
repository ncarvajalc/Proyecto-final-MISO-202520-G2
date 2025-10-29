"""Pydantic schemas for inventory management."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class WarehouseBase(BaseModel):
    """Base warehouse schema."""

    name: str
    location: str
    active: bool = True


class WarehouseCreate(WarehouseBase):
    """Schema for creating a warehouse."""

    pass


class Warehouse(WarehouseBase):
    """Warehouse response schema."""

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InventoryItem(BaseModel):
    """Inventory item for a specific warehouse."""

    warehouse: Warehouse
    stock_quantity: int
    available_quantity: int

    class Config:
        from_attributes = True


class ProductInventory(BaseModel):
    """Product inventory aggregated across warehouses."""

    product_id: int
    total_stock: int
    warehouses: List[InventoryItem]

    class Config:
        from_attributes = True
