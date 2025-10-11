from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
import uuid

if TYPE_CHECKING:
    from .order import Order

class Customer(SQLModel, table=True):
    """
    Customer model for storing client information
    Used in audit reports and order tracking
    """
    __tablename__ = "customer"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        max_length=36,
        description="Unique identifier for the customer"
    )
    
    customer_name: str = Field(
        max_length=255,
        index=True,
        description="Name of the customer or company"
    )
    
    contact_person: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Primary contact person"
    )
    
    email: str = Field(
        max_length=255,
        unique=True,
        index=True,
        description="Customer's email address"
    )
    
    phone: Optional[str] = Field(
        default=None,
        max_length=20,
        description="Customer's phone number"
    )
    
    address: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Customer's address"
    )
    
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the customer was created"
    )
    
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the customer was last updated"
    )
    
    # Relationships
    orders: List["Order"] = Relationship(back_populates="customer")

