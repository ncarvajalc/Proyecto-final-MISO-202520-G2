"""Pydantic schemas for route stop domain."""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class RouteStopBase(BaseModel):
    """Base schema for route stop with required fields."""
    route_id: str = Field(..., min_length=1, max_length=36)
    client_id: str = Field(..., min_length=1, max_length=36)
    sequence: int = Field(..., ge=1)
    estimated_arrival: Optional[datetime] = None
    delivered: bool = Field(default=False)
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    address: Optional[str] = Field(None, max_length=500)


class RouteStopCreate(RouteStopBase):
    """Schema for creating a new route stop."""
    pass


class RouteStopUpdate(BaseModel):
    """Schema for updating a route stop."""
    sequence: Optional[int] = Field(None, ge=1)
    estimated_arrival: Optional[datetime] = None
    delivered: Optional[bool] = None
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    address: Optional[str] = Field(None, max_length=500)


class RouteStop(RouteStopBase):
    """Schema for route stop response."""
    id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RouteStopPaginated(BaseModel):
    """Schema for paginated route stop response."""
    data: List[RouteStop]
    total: int
    page: int
    limit: int
    total_pages: int
