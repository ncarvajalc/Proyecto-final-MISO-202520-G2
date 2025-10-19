from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String
from typing import Optional, List, TYPE_CHECKING
from datetime import UTC, datetime
import uuid

from app.core.encryption import EncryptedString

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
        sa_column=Column(
            "customer_name",
            EncryptedString(512),
            nullable=False,
            index=True,
        ),
        max_length=255,
        description="Name of the customer or company"
    )
    
    contact_person: Optional[str] = Field(
        default=None,
        sa_column=Column(
            "contact_person",
            EncryptedString(512),
            nullable=True,
        ),
        max_length=255,
        description="Primary contact person"
    )
    
    email: str = Field(
        sa_column=Column(
            "email",
            EncryptedString(512),
            nullable=False,
            unique=True,
            index=True,
        ),
        max_length=255,
        description="Customer's email address"
    )
    
    phone: Optional[str] = Field(
        default=None,
        sa_column=Column("phone", EncryptedString(255), nullable=True),
        max_length=20,
        description="Customer's phone number"
    )
    
    address: Optional[str] = Field(
        default=None,
        sa_column=Column("address", EncryptedString(512), nullable=True),
        max_length=255,
        description="Customer's address"
    )
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when the customer was created"
    )
    
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when the customer was last updated"
    )
    
    # Relationships
    orders: List["Order"] = Relationship(back_populates="customer")

