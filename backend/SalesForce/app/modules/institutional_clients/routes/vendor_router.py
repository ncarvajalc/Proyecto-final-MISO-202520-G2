import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List
from sqlalchemy.orm import Session
from ....core.database import get_db
from ..schemas.schemas import  (
    ClientListResponse,
    ClientAssignmentBase,
    ClientAssignmentCreate
)
from ..services import client_service as services

vendedor_router = APIRouter(prefix="/vendedor", tags=["Clientes Asignados"])
logger = logging.getLogger("uvicorn")


@vendedor_router.get(
    "/{salespeople_id}/clientes",
    response_model=ClientListResponse,
    summary="Obtener lista paginada de clientes asignados a un vendedor"
)
def read_assigned_clients(
    salespeople_id: str,
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(10, ge=1, le=100, description="Registros por página"),
    db: Session = Depends(get_db)
):
    """
    Recupera la lista de clientes asignados, usando la capa de servicio para la lógica.
    """
    return services.get_assigned_clients_service(db, salespeople_id, page=page, limit=limit)


@vendedor_router.post(
    "/asignar-cliente",
    response_model=ClientAssignmentBase,
    summary="Asignar un cliente a un vendedor"
)
def create_new_assignment(
    assignment: ClientAssignmentCreate, 
    db: Session = Depends(get_db)
):
    """
    Asigna un cliente específico a un vendedor. Si la asignación ya existe, la retorna.
    """
    # Llama al servicio de creación
    new_assignment = services.create_assignment_service(db, assignment)
    
    if new_assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Cliente {assignment.client_id} no encontrado, no se pudo crear la asignación."
        )
        
    return new_assignment