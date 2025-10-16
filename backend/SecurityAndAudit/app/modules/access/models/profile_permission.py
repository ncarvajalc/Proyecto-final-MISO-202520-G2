from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import UTC, datetime

if TYPE_CHECKING:
    from .profile import Profile
    from .permission import Permission

class ProfilePermission(SQLModel, table=True):
    """
    Association table linking Profiles with Permissions
    Defines which permissions are granted to each profile
    """
    __tablename__ = "profile_permission"
    
    profile_id: str = Field(
        foreign_key="profile.id",
        primary_key=True,
        max_length=36,
        description="Reference to the profile"
    )
    
    permission_id: str = Field(
        foreign_key="permission.id",
        primary_key=True,
        max_length=36,
        description="Reference to the permission"
    )
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when the association was created"
    )
    
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when the association was last updated"
    )
    
    # Relationships
    profile: Optional["Profile"] = Relationship(back_populates="profile_permissions")
    permission: Optional["Permission"] = Relationship(back_populates="profile_permissions")

