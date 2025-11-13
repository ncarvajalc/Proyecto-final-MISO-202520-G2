from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.institutional_clients.schemas import (
    InstitutionalClient,
    InstitutionalClientCreate,
    InstitutionalClientsResponse,
    InstitutionalClientUpdate,
    TerritoriesQuery,
    InstitutionalContactClientResponse,
    TaxIdVerificationResponse,
)
from app.modules.institutional_clients.services import (
    create,
    delete,
    get_client,
    list_clients,
    update,
    list_clients_by_territories,
    list_clients_territories,
    verify_tax_identification,
)

router = APIRouter(prefix="/institutional-clients", tags=["institutional-clients"])


@router.post("/", response_model=InstitutionalClient, status_code=201)
def create_institutional_client_endpoint(
    payload: InstitutionalClientCreate, db: Session = Depends(get_db)
):
    """Create a new institutional client."""
    return create(db, payload)


@router.get("/", response_model=InstitutionalClientsResponse)
def list_institutional_clients_endpoint(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all institutional clients with pagination and optional search."""
    return list_clients(db, page=page, limit=limit, search=search)

@router.get("/cartera", response_model=InstitutionalContactClientResponse)
@router.get("/cartera/", response_model=InstitutionalContactClientResponse)
async def list_institutional_clients_endpoint(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all institutional clients with pagination and optional search."""
    return await list_clients_territories(db, page=page, limit=limit, search=search)


@router.get("/verify-tax-id", response_model=TaxIdVerificationResponse)
@router.get("/verify-tax-id/", response_model=TaxIdVerificationResponse)
def verify_tax_identification_endpoint(
    identificacion_tributaria: str = Query(..., alias="identificacion_tributaria"),
    db: Session = Depends(get_db),
):
    """Validate the institutional client's tax identification."""

    return verify_tax_identification(db, identificacion_tributaria)


@router.get("/{client_id}", response_model=InstitutionalClient)
def get_institutional_client_endpoint(client_id: str, db: Session = Depends(get_db)):
    """Get institutional client by ID."""
    return get_client(db, client_id)


@router.put("/{client_id}", response_model=InstitutionalClient)
def update_institutional_client_endpoint(
    client_id: str,
    payload: InstitutionalClientUpdate,
    db: Session = Depends(get_db),
):
    """Update an institutional client."""
    return update(db, client_id, payload)


@router.delete("/{client_id}", response_model=InstitutionalClient)
def delete_institutional_client_endpoint(client_id: str, db: Session = Depends(get_db)):
    """Delete an institutional client."""
    return delete(db, client_id)

@router.post("/by-territories", response_model=InstitutionalClientsResponse)
def list_clients_by_territories_endpoint(
    payload: TerritoriesQuery,
    page: int = 1,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    List institutional clients by a list of territory IDs, with pagination.
    """
    return list_clients_by_territories(
        db, territories=payload.territories, page=page, limit=limit
    )
