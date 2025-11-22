from datetime import UTC, datetime
from typing import Optional

from sqlmodel import Field, SQLModel
import uuid


class SecurityAlert(SQLModel, table=True):
    __tablename__ = "security_alert"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        max_length=36,
        description="Unique identifier for the security alert",
    )
    event_type: str = Field(max_length=128, description="Type of event that triggered the alert")
    severity: str = Field(
        default="high", max_length=32, description="Severity level of the alert"
    )
    description: str = Field(
        max_length=512, description="Human readable description of the alert"
    )
    actor_id: Optional[str] = Field(default=None, max_length=128)
    actor_role: Optional[str] = Field(default=None, max_length=64)
    order_id: Optional[str] = Field(default=None, max_length=64)
    source_ip: Optional[str] = Field(default=None, max_length=64)
    detected_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    acknowledged: bool = Field(default=False)
