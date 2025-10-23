"""SQLAlchemy models for route stop domain."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


def generate_uuid():
    """Generate a unique UUID string."""
    return str(uuid.uuid4())


class RouteStop(Base):
    """RouteStop model for individual stops within a route."""

    __tablename__ = "route_stops"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    route_id = Column(String(36), ForeignKey("routes.id"), nullable=False, index=True)
    client_id = Column(String(36), nullable=False)
    sequence = Column(Integer, nullable=False)
    estimated_arrival = Column(DateTime, nullable=True)
    delivered = Column(Boolean, default=False, nullable=False)
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)
    address = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    route = relationship("Route", back_populates="stops")


__all__ = ["RouteStop"]
