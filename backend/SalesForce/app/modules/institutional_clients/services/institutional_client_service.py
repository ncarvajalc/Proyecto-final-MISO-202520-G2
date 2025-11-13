import re
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
    list_clients_by_list_id_paginated,
)
from app.modules.institutional_clients.schemas import (
    InstitutionalClient,
    InstitutionalClientCreate,
    InstitutionalClientsResponse,
    InstitutionalClientUpdate,
    InstitutionalContactClient,
    InstitutionalContactClientResponse,
    TaxIdVerificationResponse,
)

TERRITORY_SERVICE_URL = "http://localhost:8004"

_TAX_ID_PATTERN = re.compile(r"^[0-9-]+$")

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
    db: Session, territories: List[str] = None,page: int = 1, limit: int = 10, search: Optional[str] = None
) -> InstitutionalContactClientResponse:
    """List all institutional clients with pagination and optional search."""
    skip = get_pagination_offset(page, limit)
    
    result = (
    list_clients_by_list_id_paginated(db, territories=territories,skip=skip, limit=limit)
    if territories
    else list_institutional_clients_paginated(db, skip=skip, limit=limit, search=search)
    )

    if not result or "total" not in result or "items" not in result:
        print("Error: list_institutional_clients_paginated devolvió un formato inesperado.")

        metadata = build_pagination_metadata(total=0, page=page, limit=limit)
        return InstitutionalContactClientResponse(data=[], **metadata)

    total = result["total"] # Esta línea ahora es segura
    clients = [InstitutionalContactClient.model_validate(item) for item in result["items"]]
    
    territory_ids = [
        client.territory_id 
        for client in clients 
        if client.territory_id
    ]

    if territory_ids:
        lineage_map = None
        async with httpx.AsyncClient() as client:
            lineage_map = await obtener_territorios_by_ids(client, territory_ids)
        

        if lineage_map:
            
            for client_obj in clients:
                if not client_obj.territory_id:
                    continue

                lineage_list = lineage_map.get(client_obj.territory_id)

                if lineage_list:
                    for ancestro in lineage_list:
                        tipo = ancestro.get("type")
                        nombre = ancestro.get("name")

                        if not tipo or not nombre:
                            continue
                        
                        # Esta es la lógica que puede estar fallando
                        if tipo == "COUNTRY":
                            client_obj.country = nombre
                        elif tipo == "STATE":
                            client_obj.state = nombre
                        elif tipo == "CITY":
                            client_obj.city = nombre
                print("---------------------------------------------------------")
        else:
            print("No se pudo obtener el linaje de los territorios (lineage_map está vacío o es None).")
    else:
        print("No hay clientes con territory_id para buscar linajes.")

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


def verify_tax_identification(
    db: Session, tax_id: str
) -> TaxIdVerificationResponse:
    """Validate format and uniqueness of a tax identification number."""

    normalized_tax_id = (tax_id or "").strip()

    if not normalized_tax_id:
        return TaxIdVerificationResponse(
            is_valid=False,
            message="La identificación tributaria es requerida",
        )

    if not _TAX_ID_PATTERN.fullmatch(normalized_tax_id):
        return TaxIdVerificationResponse(
            is_valid=False,
            message="Solo se permiten números y guiones",
        )

    existing = get_institutional_client_by_nit(db, normalized_tax_id)
    if existing:
        return TaxIdVerificationResponse(
            is_valid=False,
            message="La identificación tributaria ya está registrada",
        )

    return TaxIdVerificationResponse(
        is_valid=True,
        message="Identificación tributaria válida",
    )


async def obtener_territorios_by_ids(
    client: httpx.AsyncClient, 
    territory_ids: List[str] 
) -> Optional[Dict[str, List[Dict[str, Any]]]]:
    """
    Llama al endpoint POST /lineages-by-ids.
    Devuelve un diccionario-mapa: { "territorio_id": [lista_de_ancestros] }
    """
    if not territory_ids:
        return {} # Devuelve un dict vacío si no hay IDs, no None

    # PAYLOAD CORREGIDO: La API espera {"ids": [...]}
    payload = {"ids": territory_ids}
    
    #  NO crees un nuevo cliente. Usa el que se pasó como argumento.
    try:
        response = await client.post(
            f"{TERRITORY_SERVICE_URL}/territorios/lineages-by-ids",
            json=payload
        )
        response.raise_for_status()

        # Si tiene éxito, devuelve el JSON (que debe ser un dict)
        return response.json() 

    except httpx.HTTPStatusError as e:
        # Imprime el texto del error de la API, es muy útil
        print(f"Error HTTP de la API de linajes: {e.response.status_code} - {e.response.text}")
        return None
    except httpx.RequestError as e:
        # Error de conexión (p.ej. URL incorrecta, no se pudo conectar)
        print(f"Error de conexión con httpx: {e}")
        return None