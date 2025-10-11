import os
from typing import Literal, Optional

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, EmailStr, Field, HttpUrl, ValidationError, validator
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import Session

# Ensure that the application uses the SQLite database that is configured for tests
os.environ.setdefault("TESTING", "1")

from app.core.database import Base, get_db  # noqa: E402  (import after env configuration)


class Supplier(Base):
    """Simple SQLAlchemy model used only for tests."""

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


class SupplierCertificate(BaseModel):
    nombre: str = ""
    cuerpoCertificador: str = ""
    fechaCertificacion: str = ""
    fechaVencimiento: str = ""
    urlDocumento: Optional[HttpUrl] = None

    @validator("urlDocumento", pre=True)
    def _allow_empty_string(cls, value: Optional[str]):  # noqa: D401
        """Allow optional URL fields to be empty without validation errors."""

        if value in (None, "", " "):
            return None
        return value

    def is_empty(self) -> bool:
        return all(
            not getattr(self, field)
            for field in (
                "nombre",
                "cuerpoCertificador",
                "fechaCertificacion",
                "fechaVencimiento",
                "urlDocumento",
            )
        )

    def to_response(self) -> Optional[dict]:
        if self.is_empty():
            return None
        return {
            "nombre": self.nombre,
            "cuerpoCertificador": self.cuerpoCertificador,
            "fechaCertificacion": self.fechaCertificacion,
            "fechaVencimiento": self.fechaVencimiento,
            "urlDocumento": str(self.urlDocumento) if self.urlDocumento else "",
        }


class SupplierCreate(BaseModel):
    nombre: str = Field(..., min_length=1)
    id_tax: str = Field(..., min_length=1)
    direccion: str = Field(..., min_length=1)
    telefono: str = Field(..., min_length=1)
    correo: EmailStr
    contacto: str = Field(..., min_length=1)
    estado: Literal["Activo", "Inactivo"] = "Activo"
    certificado: Optional[SupplierCertificate] = None

    @validator("certificado", pre=True, always=True)
    def _normalize_certificate(
        cls, value: Optional[SupplierCertificate]
    ) -> Optional[SupplierCertificate]:  # noqa: D401
        """Convert dictionaries into SupplierCertificate instances when provided."""

        if value in (None, ""):
            return None
        if isinstance(value, SupplierCertificate):
            return value
        try:
            return SupplierCertificate(**value)
        except (TypeError, ValidationError):
            raise

    def to_orm_kwargs(self) -> dict:
        certificate = self.certificado
        has_certificate = bool(certificate and not certificate.is_empty())
        return {
            "nombre": self.nombre,
            "id_tax": self.id_tax,
            "direccion": self.direccion,
            "telefono": self.telefono,
            "correo": self.correo,
            "contacto": self.contacto,
            "estado": self.estado,
            "certificado_nombre": certificate.nombre if has_certificate else None,
            "certificado_cuerpo": certificate.cuerpoCertificador if has_certificate else None,
            "certificado_fecha_certificacion": certificate.fechaCertificacion if has_certificate else None,
            "certificado_fecha_vencimiento": certificate.fechaVencimiento if has_certificate else None,
            "certificado_url": str(certificate.urlDocumento) if has_certificate and certificate.urlDocumento else None,
        }


def supplier_to_dict(supplier: Supplier) -> dict:
    certificate_values = {
        "nombre": supplier.certificado_nombre or "",
        "cuerpoCertificador": supplier.certificado_cuerpo or "",
        "fechaCertificacion": supplier.certificado_fecha_certificacion or "",
        "fechaVencimiento": supplier.certificado_fecha_vencimiento or "",
        "urlDocumento": supplier.certificado_url or "",
    }

    if all(value == "" for value in certificate_values.values()):
        certificate = None
    else:
        certificate = certificate_values

    return {
        "id": supplier.id,
        "nombre": supplier.nombre,
        "id_tax": supplier.id_tax,
        "direccion": supplier.direccion,
        "telefono": supplier.telefono,
        "correo": supplier.correo,
        "contacto": supplier.contacto,
        "estado": supplier.estado,
        "certificado": certificate,
    }


router = APIRouter(prefix="/api/proveedores", tags=["proveedores"])


@router.post("", status_code=status.HTTP_201_CREATED)
def register_supplier(
    payload: SupplierCreate, db: Session = Depends(get_db)
):
    supplier = Supplier(**payload.to_orm_kwargs())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier_to_dict(supplier)


__all__ = [
    "Supplier",
    "SupplierCreate",
    "SupplierCertificate",
    "router",
    "supplier_to_dict",
]
