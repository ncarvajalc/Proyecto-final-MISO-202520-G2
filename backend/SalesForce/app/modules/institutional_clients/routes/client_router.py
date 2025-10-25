import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List
from sqlalchemy.orm import Session
from ....core.database import get_db
from ..schemas.schemas import  (
    ClientCreate, 
    ClientUpdate, 
    ClientBase,
)
from ..services import client_service as services

router_cliente = APIRouter(prefix="/cliente", tags=["clients"])
logger = logging.getLogger("uvicorn")


@router_cliente.post("/", response_model=ClientBase, status_code=status.HTTP_201_CREATED)
def create_new_client(client: ClientCreate, db: Session = Depends(get_db)):
    """Crea un nuevo cliente (pasa por el servicio)."""
    # Llama a la función del SERVICE
    return services.create_client_service(db=db, client=client)

@router_cliente.get("/", response_model=List[ClientBase])
def read_all_clients(
    page: int = Query(1, ge=1), 
    limit: int = Query(10, ge=1, le=100), 
    db: Session = Depends(get_db)
):
    """Obtiene todos los clientes con paginación (pasa por el servicio)."""
    # Llama a la función del SERVICE
    return services.get_all_clients_service(db, page=page, limit=limit)

@router_cliente.get("/{client_id}", response_model=ClientBase)
def read_client(client_id: str, db: Session = Depends(get_db)):
    """Obtiene un cliente por ID (pasa por el servicio)."""
    # Llama a la función del SERVICE
    db_client = services.get_client_service(db, client_id=client_id)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_client

@router_cliente.put("/{client_id}", response_model=ClientBase)
def update_existing_client(client_id: str, client: ClientUpdate, db: Session = Depends(get_db)):
    """Actualiza un cliente por ID (pasa por el servicio)."""
    # Llama a la función del SERVICE, que maneja la verificación y la actualización
    updated_client = services.update_client_service(db, client_id=client_id, client_update=client)
    if updated_client is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return updated_client

@router_cliente.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_client(client_id: str, db: Session = Depends(get_db)):
    """Elimina un cliente por ID (pasa por el servicio)."""
    # Llama a la función del SERVICE, que maneja la verificación y el borrado
    was_deleted = services.delete_client_service(db, client_id=client_id)
    if not was_deleted:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"ok": True}