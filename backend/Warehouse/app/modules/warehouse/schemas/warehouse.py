from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class WarehouseBase(BaseModel):
    nombre: str
    ubicacion: Optional[str] = None


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    nombre: Optional[str] = None
    ubicacion: Optional[str] = None


class Warehouse(WarehouseBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WarehouseSimple(BaseModel):
    """Schema simplificado para listados"""
    id: str
    nombre: str
    ubicacion: Optional[str] = None

    class Config:
        from_attributes = True


class WarehousePaginated(BaseModel):
    data: List[Warehouse]
    total: int
    page: int
    limit: int
    total_pages: int