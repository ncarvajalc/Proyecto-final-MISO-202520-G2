"""SQLAlchemy models for route domain."""

from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Column, String, Date, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


def generate_uuid():
    """Generate a unique UUID string."""
    return str(uuid.uuid4())


class Route(Base):
    """Route model for vehicle delivery routes."""

    __tablename__ = "routes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, default=date.today)
    total_distance_km = Column(Numeric(10, 2), nullable=False, default=0)
    estimated_time_h = Column(Numeric(10, 2), nullable=False, default=0)
    priority_level = Column(String(50), nullable=False, default="normal")
    status = Column(String(50), nullable=False, default="pending")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    stops = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan")


__all__ = ["Route"]
