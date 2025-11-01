import uuid
from sqlalchemy import Column, String, Text, TIMESTAMP, func

from app.core.database import Base


class InstitutionalClient(Base):
    __tablename__ = "institutional_clients"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre_institucion = Column(String(255), nullable=False)
    direccion = Column(String(255), nullable=False)
    direccion_institucional = Column(String(255), nullable=False)  # email
    identificacion_tributaria = Column(String(50), nullable=False, unique=True)
    representante_legal = Column(String(255), nullable=False)
    telefono = Column(String(50), nullable=False)
    justificacion_acceso = Column(Text, nullable=True)
    certificado_camara = Column(Text, nullable=True)  # base64 or file path
    territory_id = Column(String(36), nullable=True, index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
