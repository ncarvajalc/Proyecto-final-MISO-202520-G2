"""Pydantic schemas for product domain."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SpecificationSchema(BaseModel):
    """Schema for product specification."""

    nombre: str
    valor: str


class TechnicalSheetSchema(BaseModel):
    """Schema for product technical sheet."""

    urlManual: Optional[str] = None
    urlHojaInstalacion: Optional[str] = None
    certificaciones: Optional[List[str]] = None


class ProductBase(BaseModel):
    """Base schema for product with required fields."""

    sku: str = Field(..., min_length=1)
    nombre: str = Field(..., min_length=1)
    descripcion: str = Field(..., min_length=1)
    precio: int = Field(..., gt=0)
    activo: bool = True


class ProductCreate(ProductBase):
    """Schema for creating a new product."""

    especificaciones: Optional[List[SpecificationSchema]] = None
    hojaTecnica: Optional[TechnicalSheetSchema] = None


class Product(ProductBase):
    """Schema for product response."""

    id: int
    created_at: datetime
    updated_at: datetime
    especificaciones: List[SpecificationSchema] = []
    hojaTecnica: Optional[TechnicalSheetSchema] = None

    model_config = ConfigDict(from_attributes=True)


class ProductPaginated(BaseModel):
    """Schema for paginated product response."""

    data: List[Product]
    total: int
    page: int
    limit: int
    total_pages: int


__all__ = [
    "SpecificationSchema",
    "TechnicalSheetSchema",
    "ProductBase",
    "ProductCreate",
    "Product",
    "ProductPaginated",
]
