from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime
import uuid

if TYPE_CHECKING:
    from .profile import Profile

class User(SQLModel, table=True):
    """
    User model for authentication and authorization
    Stores user credentials and links to their assigned profile
    """
    __tablename__ = "user"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        max_length=36,
        description="Unique identifier for the user"
    )
    
    username: str = Field(
        max_length=255,
        unique=True,
        index=True,
        description="Unique username for login"
    )
    
    password_hash: str = Field(
        max_length=255,
        description="Hashed password for security"
    )
    
    email: str = Field(
        max_length=255,
        unique=True,
        index=True,
        description="User's email address"
    )
    
    profile_id: str = Field(
        foreign_key="profile.id",
        max_length=36,
        description="Reference to the user's assigned profile"
    )
    
    is_active: bool = Field(
        default=True,
        description="Whether the user account is active"
    )
    
    last_login_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp of the user's last login"
    )
    
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the user was created"
    )
    
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the user was last updated"
    )
    
    # Relationships
    profile: Optional["Profile"] = Relationship(back_populates="users")

