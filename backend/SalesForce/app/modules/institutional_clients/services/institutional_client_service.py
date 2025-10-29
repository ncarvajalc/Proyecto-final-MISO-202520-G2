from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.pagination import build_pagination_metadata, get_pagination_offset
from app.modules.institutional_clients.crud import (
    create_institutional_client,
    delete_institutional_client,
    get_institutional_client_by_id,
    get_institutional_client_by_nit,
    list_institutional_clients_paginated,
    update_institutional_client,
)
from app.modules.institutional_clients.schemas import (
    InstitutionalClient,
    InstitutionalClientCreate,
    InstitutionalClientsResponse,
    InstitutionalClientUpdate,
)


def create(
    db: Session, client: InstitutionalClientCreate
) -> InstitutionalClient:
    """Create a new institutional client."""
    # Check if NIT already exists
    existing = get_institutional_client_by_nit(db, client.identificacion_tributaria)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Institutional client with NIT {client.identificacion_tributaria} already exists",
        )

    created = create_institutional_client(db, client)
    return InstitutionalClient.model_validate(created)


def list_clients(
    db: Session, page: int = 1, limit: int = 10, search: Optional[str] = None
) -> InstitutionalClientsResponse:
    """List all institutional clients with pagination and optional search."""
    skip = get_pagination_offset(page, limit)
    result = list_institutional_clients_paginated(
        db, skip=skip, limit=limit, search=search
    )

    total = result["total"]
    clients = [InstitutionalClient.model_validate(item) for item in result["items"]]

    metadata = build_pagination_metadata(total=total, page=page, limit=limit)

    return InstitutionalClientsResponse(data=clients, **metadata)


def get_client(db: Session, client_id: str) -> InstitutionalClient:
    """Get institutional client by ID."""
    client = get_institutional_client_by_id(db, client_id)
    if not client:
        raise HTTPException(
            status_code=404, detail=f"Institutional client {client_id} not found"
        )
    return InstitutionalClient.model_validate(client)


def update(
    db: Session, client_id: str, client_update: InstitutionalClientUpdate
) -> InstitutionalClient:
    """Update an institutional client."""
    updated = update_institutional_client(db, client_id, client_update)
    if not updated:
        raise HTTPException(
            status_code=404, detail=f"Institutional client {client_id} not found"
        )
    return InstitutionalClient.model_validate(updated)


def delete(db: Session, client_id: str) -> InstitutionalClient:
    """Delete an institutional client."""
    deleted = delete_institutional_client(db, client_id)
    if not deleted:
        raise HTTPException(
            status_code=404, detail=f"Institutional client {client_id} not found"
        )
    return InstitutionalClient.model_validate(deleted)
