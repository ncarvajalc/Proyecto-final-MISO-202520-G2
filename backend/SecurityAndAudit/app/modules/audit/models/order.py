from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import UTC, datetime, date
from decimal import Decimal
import uuid

if TYPE_CHECKING:
    from .customer import Customer

class Order(SQLModel, table=True):
    """
    Order model for tracking customer orders
    Used in audit reports and business analytics
    """
    __tablename__ = "order"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        max_length=36,
        description="Unique identifier for the order"
    )
    
    customer_id: str = Field(
        foreign_key="customer.id",
        max_length=36,
        description="Reference to the customer who placed the order"
    )
    
    order_date: date = Field(
        default_factory=date.today,
        description="Date when the order was placed"
    )
    
    total_amount: Decimal = Field(
        max_digits=10,
        decimal_places=2,
        description="Total amount of the order"
    )
    
    status: str = Field(
        max_length=50,
        default="pending",
        description="Current status of the order (e.g., 'pending', 'processing', 'completed', 'cancelled')"
    )
    
    delivery_date: Optional[date] = Field(
        default=None,
        description="Expected or actual delivery date"
    )
    
    delivery_address: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Address where the order should be delivered"
    )
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when the order was created"
    )
    
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when the order was last updated"
    )
    
    # Relationships
    customer: Optional["Customer"] = Relationship(back_populates="orders")

