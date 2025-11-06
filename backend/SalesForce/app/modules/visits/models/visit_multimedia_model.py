import uuid
from sqlalchemy import Column, String, LargeBinary, Integer, TIMESTAMP, func, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class VisitMultimedia(Base):
    __tablename__ = "visit_multimedia"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visit_id = Column(String(36), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=False)  # MIME type (e.g., 'image/jpeg', 'video/mp4')
    file_size = Column[int](Integer, nullable=False)  # Size in bytes
    file_data = Column(LargeBinary, nullable=False)  # Binary data of the file
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationship to Visit
    visit = relationship("Visit", back_populates="multimedia")
