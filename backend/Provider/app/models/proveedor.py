from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Proveedor(Base):
    __tablename__ = "proveedores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    id_tax = Column(String)
    direccion = Column(String)
    telefono = Column(String)
    correo = Column(String)
    contacto = Column(String)
    estado = Column(String)

    # Relación con certificado
    certificado = relationship("Certificado", back_populates="proveedor", uselist=False, cascade="all, delete")


class Certificado(Base):
    __tablename__ = "certificados"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    cuerpoCertificador = Column(String)
    fechaCertificacion = Column(Date)
    fechaVencimiento = Column(Date)
    urlDocumento = Column(String)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"))

    proveedor = relationship("Proveedor", back_populates="certificado")
