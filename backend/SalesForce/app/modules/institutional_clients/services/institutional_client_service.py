from typing import List, Dict, Any, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session
import httpx

from app.core.pagination import build_pagination_metadata, get_pagination_offset
from app.modules.institutional_clients.crud import (
    create_institutional_client,
    delete_institutional_client,
    get_institutional_client_by_id,
    get_institutional_client_by_nit,
    list_institutional_clients_paginated,
    update_institutional_client,
    list_clients_by_territories_paginated,
)
from app.modules.institutional_clients.schemas import (
    InstitutionalClient,
    InstitutionalClientCreate,
    InstitutionalClientsResponse,
    InstitutionalClientUpdate,
    InstitutionalContactClient,
    InstitutionalContactClientResponse,
)

TERRITORY_SERVICE_URL = "http://localhost:8004"

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


async def list_clients_territories(
    db: Session, page: int = 1, limit: int = 10, search: Optional[str] = None
) -> InstitutionalContactClientResponse:
    """List all institutional clients with pagination and optional search."""
    skip = get_pagination_offset(page, limit)
    result = list_institutional_clients_paginated(
        db, skip=skip, limit=limit, search=search
    )

    total = result["total"]
    clients = [InstitutionalContactClient.model_validate(item) for item in result["items"]]
    territory_ids = [client.territory_id for client in clients]

    async with httpx.AsyncClient() as client:
        
        territorios = await obtener_territorios(client, territory_ids)
        
        if territorios:
            print("Territorios encontrados:")
            for territorio in territorios:
                print(f"  - Nombre: {territorio['name']}, Tipo: {territorio['type']}")
        else:
            print("No se encontró ningún territorio o hubo un error.")


    metadata = build_pagination_metadata(total=total, page=page, limit=limit)

    return InstitutionalContactClientResponse(data=clients, **metadata)


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

def list_clients_by_territories(
    db: Session, territories: List[str], page: int = 1, limit: int = 100
) -> InstitutionalClientsResponse:
    """List clients by territory IDs with pagination."""
    skip = get_pagination_offset(page, limit)
    result = list_clients_by_territories_paginated(
        db, territories=territories, skip=skip, limit=limit
    )

    total = result["total"]
    clients = [InstitutionalClient.model_validate(item) for item in result["items"]]

    metadata = build_pagination_metadata(total=total, page=page, limit=limit)

    return InstitutionalClientsResponse(data=clients, **metadata)


async def obtener_territorios_by_ids(
    client: httpx.AsyncClient, 
    territories: List[str]
) -> List[Dict[str, Any]]:
    """territory."""
    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            response = await client.get(
                f"{TERRITORY_SERVICE_URL}/by-ids",
                json=territories
            )
            response.raise_for_status()

            return response.json() 

        except httpx.HTTPStatusError as e:
            # El servidor respondió con un error (4xx o 5xx)
            print(f"Error HTTP de la API: {e.response.status_code} - {e.response.text}")
            return [] # Devuelve lista vacía en caso de error
        except httpx.RequestError as e:
            # Error de conexión, timeout, etc.
            print(f"Error de conexión con httpx: {e}")
            return []