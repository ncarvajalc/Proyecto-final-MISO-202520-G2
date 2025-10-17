"""SQLAlchemy models for supplier persistence."""

from __future__ import annotations

from sqlalchemy import Column, Integer, String

from app.core.database import Base
from app.core.encryption import EncryptedString


class Supplier(Base):
    """Minimal supplier model matching the registration schema."""

    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(EncryptedString(512), nullable=False)
    id_tax = Column(EncryptedString(255), nullable=False)
    direccion = Column(EncryptedString(512), nullable=False)
    telefono = Column(EncryptedString(255), nullable=False)
    correo = Column(EncryptedString(512), nullable=False)
    contacto = Column(EncryptedString(512), nullable=False)
    estado = Column(String, nullable=False, default="Activo")
    certificado_nombre = Column(EncryptedString(512), nullable=True)
    certificado_cuerpo = Column(EncryptedString(512), nullable=True)
    certificado_fecha_certificacion = Column(EncryptedString(255), nullable=True)
    certificado_fecha_vencimiento = Column(EncryptedString(255), nullable=True)
    certificado_url = Column(EncryptedString(512), nullable=True)


__all__ = ["Supplier"]
