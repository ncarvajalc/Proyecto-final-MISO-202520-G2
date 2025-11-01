from typing import List,Optional

from sqlalchemy.orm import Session

from app.modules.institutional_clients.models import InstitutionalClient
from app.modules.institutional_clients.schemas import (
    InstitutionalClientCreate,
    InstitutionalClientUpdate,
)


def list_institutional_clients_paginated(
    db: Session, skip: int, limit: int, search: Optional[str] = None
):
    """List all institutional clients with pagination and optional search."""
    query = db.query(InstitutionalClient).order_by(
        InstitutionalClient.created_at.desc()
    )

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            InstitutionalClient.nombre_institucion.ilike(search_term)
            | InstitutionalClient.direccion.ilike(search_term)
            | InstitutionalClient.identificacion_tributaria.ilike(search_term)
        )

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {"items": items, "total": total}


def get_institutional_client_by_id(db: Session, client_id: str):
    """Get institutional client by ID."""
    return (
        db.query(InstitutionalClient)
        .filter(InstitutionalClient.id == client_id)
        .first()
    )


def get_institutional_client_by_nit(db: Session, nit: str):
    """Get institutional client by tax ID (NIT)."""
    return (
        db.query(InstitutionalClient)
        .filter(InstitutionalClient.identificacion_tributaria == nit)
        .first()
    )


def create_institutional_client(db: Session, client: InstitutionalClientCreate):
    """Create a new institutional client."""
    db_client = InstitutionalClient(
        nombre_institucion=client.nombre_institucion,
        direccion=client.direccion,
        direccion_institucional=client.direccion_institucional,
        identificacion_tributaria=client.identificacion_tributaria,
        representante_legal=client.representante_legal,
        telefono=client.telefono,
        justificacion_acceso=client.justificacion_acceso,
        certificado_camara=client.certificado_camara,
        territory_id=client.territory_id,
    )
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client


def update_institutional_client(
    db: Session, client_id: str, client_update: InstitutionalClientUpdate
):
    """Update an institutional client."""
    db_client = get_institutional_client_by_id(db, client_id)
    if not db_client:
        return None

    update_data = client_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_client, field, value)

    db.commit()
    db.refresh(db_client)
    return db_client


def delete_institutional_client(db: Session, client_id: str):
    """Delete an institutional client."""
    db_client = get_institutional_client_by_id(db, client_id)
    if not db_client:
        return None

    db.delete(db_client)
    db.commit()
    return db_client

def list_clients_by_territories_paginated(
    db: Session, territories: List[str], skip: int, limit: int):

    # Si la lista está vacía, no devolvemos nada
    if not territories:
        return {"items": [], "total": 0}

    # Filtramos usando 'in_' para la lista de IDs
    query = (
        db.query(InstitutionalClient)
        .filter(InstitutionalClient.territory_id.in_(territories))
        .order_by(InstitutionalClient.created_at.desc())
    )

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {"items": items, "total": total}