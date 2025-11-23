from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from .visit_multimedia import VisitMultimedia


class VisitBase(BaseModel):
    nombre_institucion: str
    direccion: str
    hora: datetime
    desplazamiento_minutos: Optional[int] = None
    hora_salida: Optional[datetime] = None
    estado: str
    observacion: Optional[str] = None


class VisitCreate(VisitBase):
    pass


class Visit(VisitBase):
    id: str
    created_at: datetime
    updated_at: datetime
    multimedia: Optional[List[VisitMultimedia]] = []

    model_config = ConfigDict(from_attributes=True)


class VisitsResponse(BaseModel):
    data: List[Visit]
    total: int
    page: int
    limit: int
    total_pages: int
