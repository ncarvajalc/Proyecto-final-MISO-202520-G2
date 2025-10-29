import uuid
from sqlalchemy import Column, String, DateTime, Integer, Text, TIMESTAMP, func

from app.core.database import Base


class Visit(Base):
    __tablename__ = "visits"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre_institucion = Column(String(255), nullable=False)
    direccion = Column(String(255), nullable=False)
    hora = Column(DateTime, nullable=False)
    desplazamiento_minutos = Column(Integer, nullable=True)
    hora_salida = Column(DateTime, nullable=True)
    estado = Column(String(50), nullable=False)
    observacion = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
