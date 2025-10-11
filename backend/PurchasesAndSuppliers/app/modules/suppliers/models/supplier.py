"""Supplier core data models used across the purchases and suppliers module."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    HttpUrl,
    ValidationError,
    field_validator,
)


class SupplierCertificate(BaseModel):
    """Represents certification metadata provided by a supplier."""

    nombre: str = ""
    cuerpoCertificador: str = ""
    fechaCertificacion: str = ""
    fechaVencimiento: str = ""
    urlDocumento: Optional[HttpUrl] = None

    @field_validator("urlDocumento", mode="before")
    def _allow_blank_url(cls, value: Optional[str]):  # noqa: D401
        """Allow optional URL fields to be blank without raising validation errors."""

        if value in (None, "", " "):
            return None
        return value

    def is_empty(self) -> bool:
        """Return ``True`` when every attribute is empty or ``None``."""

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

    def to_response(self) -> Optional[dict[str, str]]:
        """Serialize the certificate only when there is meaningful information."""

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
    """Domain model used to validate supplier creation payloads."""

    nombre: str = Field(..., min_length=1)
    id_tax: str = Field(..., min_length=1)
    direccion: str = Field(..., min_length=1)
    telefono: str = Field(..., min_length=1)
    correo: EmailStr
    contacto: str = Field(..., min_length=1)
    estado: Literal["Activo", "Inactivo"] = "Activo"
    certificado: Optional[SupplierCertificate] = None

    @field_validator("certificado", mode="before")
    def _normalize_certificate(
        cls, value: Optional[SupplierCertificate]
    ) -> Optional[SupplierCertificate]:  # noqa: D401
        """Convert dictionaries into :class:`SupplierCertificate` instances."""

        if value in (None, ""):
            return None
        if isinstance(value, SupplierCertificate):
            return value
        try:
            return SupplierCertificate(**value)
        except (TypeError, ValidationError):
            raise

    def to_orm_kwargs(self) -> dict[str, Optional[str]]:
        """Map the model into keyword arguments suitable for ORM persistence."""

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
            "certificado_cuerpo": certificate.cuerpoCertificador
            if has_certificate
            else None,
            "certificado_fecha_certificacion": certificate.fechaCertificacion
            if has_certificate
            else None,
            "certificado_fecha_vencimiento": certificate.fechaVencimiento
            if has_certificate
            else None,
            "certificado_url": str(certificate.urlDocumento)
            if has_certificate and certificate.urlDocumento
            else None,
        }


__all__ = ["SupplierCertificate", "SupplierCreate"]
