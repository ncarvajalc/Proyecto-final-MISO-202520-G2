"""Pydantic schemas for vehicle domain."""

from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict, Field


class VehicleBase(BaseModel):
    """Base schema for vehicle with required fields."""

    placa: str = Field(..., min_length=1, max_length=20)
    conductor: str = Field(..., min_length=1, max_length=255)
    numero_entregas: int = Field(default=0, ge=0)


class VehicleCreate(VehicleBase):
    """Schema for creating a new vehicle."""

    pass


class Vehicle(VehicleBase):
    """Schema for vehicle response."""

    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VehiclePaginated(BaseModel):
    """Schema for paginated vehicle response."""

    data: List[Vehicle]
    total: int
    page: int
    limit: int
    total_pages: int


__all__ = [
    "VehicleBase",
    "VehicleCreate",
    "Vehicle",
    "VehiclePaginated",
]
