# services.py
from sqlalchemy.orm import Session
from typing import List, Optional
from ..schemas.schemas import ClientListResponse, ClientAssignedDetail, ClientCreate, ClientUpdate, ClientAssignmentCreate, ClientAssignmentBase
from ..models.models import Client, ClientAssignment
from ..crud import client_crud as crud

# ------------------------------
# Servicio CRUD para la Entidad Client
# ------------------------------

def create_client_service(db: Session, client: ClientCreate) -> Client:
    """
    Servicio para crear un cliente. 
    """
    # if client.country == 'Wakanda': 
    #     raise PermissionError("Acceso denegado")
    
    return crud.create_client(db=db, client=client)

def get_client_service(db: Session, client_id: str) -> Optional[Client]:
    """Servicio para obtener un cliente por ID."""
    return crud.get_client(db, client_id=client_id)

def get_all_clients_service(db: Session, page: int, limit: int) -> List[Client]:
    """Servicio para obtener una lista paginada de todos los clientes."""
    # Lógica de negocio antes de DB: (ej: filtrar por permisos de usuario)
    return crud.get_all_clients(db, page=page, limit=limit)

def update_client_service(db: Session, client_id: str, client_update: ClientUpdate) -> Optional[Client]:
    """
    Servicio para actualizar un cliente existente. 
    Maneja la verificación de existencia y la actualización.
    """
    db_client = crud.get_client(db, client_id=client_id)
    
    if db_client is None:
        return None  # Indica que el cliente no existe
        
    # if client_update.country and client_update.country != db_client.country:
    #     print("Notificación: cambio de país.")
        
    return crud.update_client(db, db_client=db_client, client_update=client_update)

def delete_client_service(db: Session, client_id: str) -> bool:
    """Servicio para borrar un cliente. Devuelve True si borra, False si no existe."""
    db_client = crud.get_client(db, client_id=client_id)
    
    if db_client is None:
        return False
        
    # if has_pending_transactions(db_client):
    #     raise BusinessRuleError("No se puede borrar con transacciones pendientes.")
        
    crud.delete_client(db, db_client=db_client)
    return True

# ------------------------------
# Servicio de Clientes Asignados (Consulta más compleja)
# ------------------------------

def get_assigned_clients_service(db: Session, salespeople_id: str, page: int, limit: int) -> ClientListResponse:
    """
    Obtiene la lista de clientes asignados (JOIN) y formatea la respuesta.
    (Lógica de Negocio/Servicio)
    """
    
    # Llama a la capa de CRUD/DB para obtener los modelos Client
    client_models = crud.get_assigned_clients_from_db(db, salespeople_id, page=page, limit=limit)
    
    # Mapea los modelos Client al esquema ClientAssignedDetail y arma la respuesta final
    detailed_clients = [ClientAssignedDetail.from_orm(client) for client in client_models]
    
    return ClientListResponse(
        salespeople_id=salespeople_id,
        clients=detailed_clients
    )

def create_assignment_service(db: Session, assignment: ClientAssignmentCreate) -> Optional[ClientAssignment]:
    """
    Servicio para crear una asignación.
    """
    client_exists = crud.get_client(db, client_id=assignment.client_id)
    
    if not client_exists:
        return None
    
    existing_assignment = crud.get_assignment_by_client_and_salesperson(
        db, 
        client_id=assignment.client_id, 
        salespeople_id=assignment.salespeople_id
    )
    
    if existing_assignment:
        return existing_assignment
    
    # Crear la asignación a través del CRUD
    db_assignment = crud.create_assignment(db, assignment)
    return db_assignment