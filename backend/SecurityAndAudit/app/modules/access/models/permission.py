from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import UTC, datetime
import uuid

if TYPE_CHECKING:
    from .profile_permission import ProfilePermission

class Permission(SQLModel, table=True):
    """
    Permission model representing a specific action in the system
    Examples: 'create_document', 'edit_profile', 'delete_user', 'view_reports'
    """
    __tablename__ = "permission"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        max_length=36,
        description="Unique identifier for the permission"
    )
    
    permission_name: str = Field(
        max_length=255,
        unique=True,
        index=True,
        description="Name of the permission (e.g., 'create_document', 'view_reports')"
    )
    
    description: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Description of what the permission allows"
    )
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when the permission was created"
    )
    
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when the permission was last updated"
    )
    
    # Relationships
    profile_permissions: List["ProfilePermission"] = Relationship(back_populates="permission")

