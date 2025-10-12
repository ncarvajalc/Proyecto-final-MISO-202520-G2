from pydantic import BaseModel
from datetime import date

class CertificadoBase(BaseModel):
    nombre: str
    cuerpoCertificador: str
    fechaCertificacion: date
    fechaVencimiento: date
    urlDocumento: str


class CertificadoCreate(CertificadoBase):
    pass


class CertificadoOut(CertificadoBase):
    id: int

    class Config:
        from_attributes = True


class ProveedorBase(BaseModel):
    nombre: str
    id_tax: str | None = None
    direccion: str | None = None
    telefono: str | None = None
    correo: str | None = None
    contacto: str | None = None
    estado: str | None = None


class ProveedorCreate(ProveedorBase):
    certificado: CertificadoCreate


class ProveedorOut(ProveedorBase):
    id: int
    certificado: CertificadoOut | None = None

    class Config:
        from_attributes = True
