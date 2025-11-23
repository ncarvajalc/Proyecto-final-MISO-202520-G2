from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class VisitMultimediaBase(BaseModel):
    file_name: str
    file_type: str
    file_size: int


class VisitMultimediaCreate(VisitMultimediaBase):
    file_data: bytes  # Binary data for upload


class VisitMultimedia(VisitMultimediaBase):
    id: str
    visit_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VisitMultimediaResponse(VisitMultimedia):
    """Response schema that includes file data for download"""
    file_data: Optional[bytes] = None

    model_config = ConfigDict(from_attributes=True)
