from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
import uuid

if TYPE_CHECKING:
    from .user import User
    from .profile_permission import ProfilePermission

class Profile(SQLModel, table=True):
    """
    Profile model representing a role in the system
    Groups permissions and is assigned to users
    Examples: Administrator, Editor, Viewer, etc.
    """
    __tablename__ = "profile"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        max_length=36,
        description="Unique identifier for the profile"
    )
    
    profile_name: str = Field(
        max_length=255,
        unique=True,
        index=True,
        description="Name of the profile (e.g., 'Administrator', 'Editor')"
    )
    
    description: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Description of the profile's purpose"
    )
    
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the profile was created"
    )
    
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the profile was last updated"
    )
    
    # Relationships
    users: List["User"] = Relationship(back_populates="profile")
    profile_permissions: List["ProfilePermission"] = Relationship(back_populates="profile")

