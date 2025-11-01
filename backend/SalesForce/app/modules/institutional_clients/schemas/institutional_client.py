from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class InstitutionalClientBase(BaseModel):
    nombre_institucion: str
    direccion: str
    direccion_institucional: EmailStr
    identificacion_tributaria: str
    representante_legal: str
    telefono: str
    justificacion_acceso: Optional[str] = None
    certificado_camara: Optional[str] = None  # base64 encoded or file path
    territory_id: Optional[str] = None


class InstitutionalClientCreate(InstitutionalClientBase):
    pass


class InstitutionalClientUpdate(BaseModel):
    nombre_institucion: Optional[str] = None
    direccion: Optional[str] = None
    direccion_institucional: Optional[EmailStr] = None
    representante_legal: Optional[str] = None
    telefono: Optional[str] = None
    justificacion_acceso: Optional[str] = None
    certificado_camara: Optional[str] = None
    territory_id: Optional[str] = None


class InstitutionalClient(InstitutionalClientBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InstitutionalClientsResponse(BaseModel):
    data: List[InstitutionalClient]
    total: int
    page: int
    limit: int
    total_pages: int

class TerritoriesQuery(BaseModel):
    territories: List[str]

class InstitutionalContactClient(InstitutionalClient):
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None

class InstitutionalContactClientResponse(BaseModel):
    data: List[InstitutionalContactClient]
    total: int
    page: int
    limit: int
    total_pages: int