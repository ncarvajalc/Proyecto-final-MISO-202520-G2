"""Schemas for Informe Comercial API endpoints."""

from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict, Field


class InformeComercialCreate(BaseModel):
    """Schema for creating a new commercial report."""
    model_config = ConfigDict(populate_by_name=True)

    nombre: str = Field(..., min_length=2, max_length=255)


class InformeComercial(BaseModel):
    """Schema for commercial report response."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    nombre: str
    fecha: datetime
    ventas_totales: float = Field(alias="ventasTotales")
    unidades_vendidas: float = Field(alias="unidadesVendidas")


class InformeComercialPaginated(BaseModel):
    """Schema for paginated commercial reports response."""
    model_config = ConfigDict(populate_by_name=True)

    data: List[InformeComercial]
    total: int
    page: int
    limit: int
    total_pages: int

