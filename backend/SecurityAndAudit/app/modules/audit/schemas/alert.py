from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UnauthorizedOrderStatusAttempt(BaseModel):
    order_id: str
    user_id: Optional[str] = None
    user_role: Optional[str] = None
    source_ip: Optional[str] = None
    reason: Optional[str] = None


class AlertResponse(BaseModel):
    alert_id: str
    event_type: str
    severity: str
    description: str
    detected_at: datetime
    processing_time_ms: int
    acknowledged: bool
