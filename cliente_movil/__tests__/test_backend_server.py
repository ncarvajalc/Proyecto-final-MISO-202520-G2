from __future__ import annotations

import argparse
import os
import sys
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Configure import paths so we can reuse the backend authentication service
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

SECURITY_ROOT = ROOT / "backend" / "SecurityAndAudit"
if str(SECURITY_ROOT) not in sys.path:
    sys.path.insert(0, str(SECURITY_ROOT))

# ---------------------------------------------------------------------------
# Prepare SecurityAndAudit service to run against a local SQLite database
# ---------------------------------------------------------------------------
os.environ.setdefault("TESTING", "1")
security_db_path = ROOT / "cliente_movil" / "__tests__" / "data"
security_db_path.mkdir(parents=True, exist_ok=True)
os.environ.setdefault(
    "TEST_DATABASE_URL",
    f"sqlite:///{security_db_path / 'security_test.db'}",
)

from backend.SecurityAndAudit.app.core import init_db as security_init_db  # noqa: E402
from backend.SecurityAndAudit.app.core import seed_db as security_seed_db  # noqa: E402
from backend.SecurityAndAudit.app.modules.access.routes.auth import (  # noqa: E402
    router as auth_router,
)

security_init_db.init_db()
security_seed_db.seed_permissions()
security_seed_db.seed_profiles()
security_seed_db.seed_profile_permissions()
security_seed_db.seed_users()

# ---------------------------------------------------------------------------
# Data models used for institutional clients and visits in memory
# ---------------------------------------------------------------------------


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    return value.isoformat().replace("+00:00", "Z")


@dataclass
class InstitutionalClient:
    nombre_institucion: str
    direccion: str
    direccion_institucional: str
    identificacion_tributaria: str
    representante_legal: str
    telefono: str
    justificacion_acceso: Optional[str] = None
    certificado_camara: Optional[str] = None
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=utcnow)
    updated_at: datetime = field(default_factory=utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "nombre_institucion": self.nombre_institucion,
            "direccion": self.direccion,
            "direccion_institucional": self.direccion_institucional,
            "identificacion_tributaria": self.identificacion_tributaria,
            "representante_legal": self.representante_legal,
            "telefono": self.telefono,
            "justificacion_acceso": self.justificacion_acceso,
            "certificado_camara": self.certificado_camara,
            "created_at": to_iso(self.created_at),
            "updated_at": to_iso(self.updated_at),
        }


@dataclass
class Visit:
    nombre_institucion: str
    direccion: str
    hora: datetime
    estado: str
    desplazamiento_minutos: Optional[int] = None
    hora_salida: Optional[datetime] = None
    observacion: Optional[str] = None
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=utcnow)
    updated_at: datetime = field(default_factory=utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "nombre_institucion": self.nombre_institucion,
            "direccion": self.direccion,
        "hora": to_iso(self.hora),
        "desplazamiento_minutos": self.desplazamiento_minutos,
        "hora_salida": to_iso(self.hora_salida) if self.hora_salida else None,
        "estado": self.estado,
        "observacion": self.observacion,
        "created_at": to_iso(self.created_at),
        "updated_at": to_iso(self.updated_at),
        }


class VisitCreate(BaseModel):
    nombre_institucion: str
    direccion: str
    hora: datetime
    estado: str
    desplazamiento_minutos: Optional[int] = None
    hora_salida: Optional[datetime] = None
    observacion: Optional[str] = None


class PaginatedResponse(BaseModel):
    data: List[Dict[str, Any]]
    total: int
    page: int
    limit: int
    total_pages: int


class CreateInstitutionalClient(BaseModel):
    nombre_institucion: str
    direccion: str
    direccion_institucional: str
    identificacion_tributaria: str
    representante_legal: str
    telefono: str
    justificacion_acceso: Optional[str] = None
    certificado_camara: Optional[str] = None


class UpdateInstitutionalClient(BaseModel):
    nombre_institucion: Optional[str] = None
    direccion: Optional[str] = None
    direccion_institucional: Optional[str] = None
    representante_legal: Optional[str] = None
    telefono: Optional[str] = None
    justificacion_acceso: Optional[str] = None
    certificado_camara: Optional[str] = None


# ---------------------------------------------------------------------------
# Application setup
# ---------------------------------------------------------------------------

app = FastAPI(title="Mobile Test Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)

_clients: List[InstitutionalClient] = [
    InstitutionalClient(
        nombre_institucion="Colegio Central",
        direccion="Cra 45 #20-10",
        direccion_institucional="contacto@colegiocentral.edu",
        identificacion_tributaria="900123456",
        representante_legal="Ana Gómez",
        telefono="3201234567",
    ),
    InstitutionalClient(
        nombre_institucion="Universidad Andina",
        direccion="Av. 7 #30-20",
        direccion_institucional="info@uandina.edu",
        identificacion_tributaria="900654321",
        representante_legal="Carlos Ruiz",
        telefono="3109876543",
    ),
]

_visits: List[Visit] = []
_fail_visit_creation: bool = False


def paginate(items: List[Dict[str, Any]], page: int, limit: int) -> PaginatedResponse:
    total = len(items)
    total_pages = max(1, (total + limit - 1) // limit) if limit else 1
    if limit:
        start = (page - 1) * limit
        end = start + limit
        paginated = items[start:end]
    else:
        paginated = items
    return PaginatedResponse(
        data=paginated,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/institutional-clients/")
def list_institutional_clients(page: int = 1, limit: int = 10, search: Optional[str] = None) -> PaginatedResponse:
    items = [client.to_dict() for client in _clients]
    if search:
        lowered = search.lower()
        items = [item for item in items if lowered in item["nombre_institucion"].lower()]
    return paginate(items, page, limit)


@app.get("/institutional-clients/{client_id}")
def get_institutional_client(client_id: str) -> Dict[str, Any]:
    for client in _clients:
        if client.id == client_id:
            return client.to_dict()
    raise HTTPException(status_code=404, detail="Cliente no encontrado")


@app.post("/institutional-clients/")
def create_institutional_client(payload: CreateInstitutionalClient) -> Dict[str, Any]:
    client = InstitutionalClient(**payload.model_dump())
    _clients.append(client)
    return client.to_dict()


@app.put("/institutional-clients/{client_id}")
def update_institutional_client(client_id: str, payload: UpdateInstitutionalClient) -> Dict[str, Any]:
    for client in _clients:
        if client.id == client_id:
            data = payload.model_dump(exclude_unset=True)
            for key, value in data.items():
                setattr(client, key, value)
            client.updated_at = utcnow()
            return client.to_dict()
    raise HTTPException(status_code=404, detail="Cliente no encontrado")


@app.get("/visitas/")
def list_visits(page: int = 1, limit: int = 10) -> PaginatedResponse:
    items = [visit.to_dict() for visit in _visits]
    return paginate(items, page, limit)


@app.post("/visitas/")
def create_visit(payload: VisitCreate) -> Dict[str, Any]:
    global _fail_visit_creation
    if _fail_visit_creation:
        _fail_visit_creation = False
        raise HTTPException(status_code=500, detail="No se pudo crear la visita")

    visit = Visit(
        nombre_institucion=payload.nombre_institucion,
        direccion=payload.direccion,
        hora=payload.hora,
        estado=payload.estado,
        desplazamiento_minutos=payload.desplazamiento_minutos,
        hora_salida=payload.hora_salida,
        observacion=payload.observacion,
    )
    _visits.append(visit)
    return visit.to_dict()


@app.get("/__testing__/visits")
def get_recorded_visits() -> Dict[str, Any]:
    return {"visits": [visit.to_dict() for visit in _visits]}


@app.post("/__testing__/fail-next-visit")
def fail_next_visit() -> Dict[str, str]:
    global _fail_visit_creation
    _fail_visit_creation = True
    return {"status": "next visit will fail"}


@app.post("/__testing__/reset")
def reset_state() -> Dict[str, str]:
    _visits.clear()
    global _fail_visit_creation
    _fail_visit_creation = False
    return {"status": "reset"}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the test backend server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()

    import uvicorn

    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
