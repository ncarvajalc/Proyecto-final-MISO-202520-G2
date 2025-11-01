import uuid
from sqlalchemy import Column, String, ForeignKey, TIMESTAMP, Enum as SAEnum, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.modules.territories.schemas.territories_schemas import TerritoryType

class Territorio(Base):
    __tablename__ = "territorios"

    # Columnas
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True, nullable=False)
    type = Column(SAEnum(TerritoryType, name="territory_type_enum"), nullable=False)
    id_parent = Column(UUID(as_uuid=True), ForeignKey("territorios.id"), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    children = relationship(
        "Territorio",
        back_populates="parent",
        cascade="all, delete-orphan"
    )
    parent = relationship(
        "Territorio",
        back_populates="children",
        remote_side=[id]
    )