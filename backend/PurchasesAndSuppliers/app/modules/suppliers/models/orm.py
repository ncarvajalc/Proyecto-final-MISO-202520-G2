"""SQLAlchemy models for supplier persistence."""

from __future__ import annotations

from sqlalchemy import Column, Integer, String

from app.core.database import Base


class Supplier(Base):
    """Minimal supplier model matching the registration schema."""

    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    id_tax = Column(String, nullable=False)
    direccion = Column(String, nullable=False)
    telefono = Column(String, nullable=False)
    correo = Column(String, nullable=False)
    contacto = Column(String, nullable=False)
    estado = Column(String, nullable=False, default="Activo")
    certificado_nombre = Column(String, nullable=True)
    certificado_cuerpo = Column(String, nullable=True)
    certificado_fecha_certificacion = Column(String, nullable=True)
    certificado_fecha_vencimiento = Column(String, nullable=True)
    certificado_url = Column(String, nullable=True)


__all__ = ["Supplier"]
