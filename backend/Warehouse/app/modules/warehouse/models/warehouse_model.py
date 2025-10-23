import uuid
from sqlalchemy import Column, String, Text, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = Column(String(255), nullable=False, index=True)
    ubicacion = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relaciones futuras (productos, inventario, etc.)
    # inventory = relationship("Inventory", back_populates="warehouse")