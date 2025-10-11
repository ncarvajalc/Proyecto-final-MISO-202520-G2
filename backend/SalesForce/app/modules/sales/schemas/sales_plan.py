from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SalesPlanCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    identificador: str = Field(..., min_length=1)
    nombre: str = Field(..., min_length=2)
    descripcion: str = Field(..., min_length=1)
    periodo: str = Field(..., min_length=1)
    meta: float = Field(..., gt=0)
    vendedor_id: str = Field(..., min_length=1, alias="vendedorId")


class SalesPlan(SalesPlanCreate):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    unidades_vendidas: float = Field(alias="unidadesVendidas")
    vendedor_nombre: Optional[str] = Field(default=None, alias="vendedorNombre")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class SalesPlanPaginated(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    data: List[SalesPlan]
    total: int
    page: int
    limit: int
    total_pages: int = Field(alias="totalPages")
