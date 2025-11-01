"""Pydantic schemas for route domain."""

from datetime import datetime
from datetime import date as date_type
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class RouteBase(BaseModel):
    """Base schema for route with required fields."""
    vehicle_id: str = Field(..., min_length=1, max_length=36)
    date: date_type = Field(...)
    total_distance_km: Decimal = Field(default=Decimal("0.0"), ge=0)
    estimated_time_h: Decimal = Field(default=Decimal("0.0"), ge=0)
    priority_level: str = Field(default="normal", max_length=50)
    status: str = Field(default="pending", max_length=50)


class RouteCreate(RouteBase):
    """Schema for creating a new route."""
    pass


class RouteUpdate(BaseModel):
    """Schema for updating a route."""
    total_distance_km: Optional[Decimal] = Field(None, ge=0)
    estimated_time_h: Optional[Decimal] = Field(None, ge=0)
    priority_level: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)


class Route(RouteBase):
    """Schema for route response."""
    id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RoutePaginated(BaseModel):
    """Schema for paginated route response."""
    data: List[Route]
    total: int
    page: int
    limit: int
    total_pages: int
