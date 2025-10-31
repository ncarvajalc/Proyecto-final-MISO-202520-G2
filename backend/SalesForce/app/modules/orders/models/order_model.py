from sqlalchemy import Column, Integer, String, Date, DECIMAL, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from datetime import date

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    institutional_client_id = Column(
        String(36),
        ForeignKey("institutional_clients.id"),
        nullable=False
    )
    order_date = Column(Date, nullable=False, default=date.today)
    subtotal = Column(DECIMAL(10, 2), nullable=False)
    tax_amount = Column(DECIMAL(10, 2), nullable=False)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    institutional_client = relationship("InstitutionalClient")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
