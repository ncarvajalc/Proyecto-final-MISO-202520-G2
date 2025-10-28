"""SQLAlchemy models for vehicle domain."""

from __future__ import annotations

import uuid

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


def generate_uuid():
    """Generate a unique UUID string."""
    return str(uuid.uuid4())


class Vehicle(Base):
    """Vehicle model for tracking delivery vehicles."""

    __tablename__ = "vehicles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    placa = Column(String(20), unique=True, nullable=False, index=True)
    conductor = Column(String(255), nullable=False)
    numero_entregas = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


__all__ = ["Vehicle"]

