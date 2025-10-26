import uuid
from sqlalchemy import Column, String, Integer, Date, TIMESTAMP, ForeignKey, func, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class ProductInventory(Base):
    __tablename__ = "product_inventory"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    warehouse_id = Column(String(36), ForeignKey("warehouses.id"), nullable=False)
    product_id = Column(String(36), nullable=False, index=True)
    batch_number = Column(String(255), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=0)
    storage_type = Column(String(50), nullable=False)  # general, cold, ultra-cold
    zona = Column(String(50), nullable=True)  # Physical location/zone in warehouse (e.g., "Z4-2", "A1-5")
    capacity = Column(Integer, nullable=True)
    expiration_date = Column(Date, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relación con Warehouse
    warehouse = relationship("Warehouse", back_populates="inventory")

    def __repr__(self):
        return f"<ProductInventory(id={self.id}, product_id={self.product_id}, warehouse={self.warehouse_id}, quantity={self.quantity})>"