from datetime import datetime
from typing import List

from pydantic import BaseModel


class OutboundEmailDTO(BaseModel):
    id: int
    to_address: str
    subject: str
    body: str
    created_at: datetime


class OutboundEmailListResponse(BaseModel):
    total: int
    messages: List[OutboundEmailDTO]
