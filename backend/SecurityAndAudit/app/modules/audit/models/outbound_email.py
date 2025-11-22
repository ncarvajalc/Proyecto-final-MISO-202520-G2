from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class OutboundEmail(SQLModel, table=True):
    __tablename__ = "outbound_emails"

    id: int | None = Field(default=None, primary_key=True)
    to_address: str = Field(index=True, max_length=255)
    subject: str = Field(max_length=255)
    body: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
