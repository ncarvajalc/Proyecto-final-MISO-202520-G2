"""Warehouse model for inventory management."""

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Warehouse(Base):
    """Warehouse model representing physical storage locations."""

    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    inventory_items = relationship(
        "app.modules.inventory.models.inventory.Inventory",
        back_populates="warehouse",
    )
