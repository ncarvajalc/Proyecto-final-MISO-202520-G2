from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.models import Client, ClientAssignment
from ..schemas.schemas import ClientCreate, ClientUpdate, ClientAssignmentCreate
from sqlalchemy import select, func, and_

# ------------------------------
# CRUD de la Entidad Client
# ------------------------------

def create_client(db: Session, client: ClientCreate) -> Client:
    """Crea un nuevo cliente en la base de datos."""
    db_client = Client(**client.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

def get_client(db: Session, client_id: str) -> Optional[Client]:
    """Obtiene un cliente por su ID."""
    stmt = select(Client).where(Client.id == client_id)
    return db.scalar(stmt)

def get_all_clients(db: Session, page: int, limit: int) -> List[Client]:
    """Obtiene una lista paginada de todos los clientes."""
    offset = (page - 1) * limit
    
    stmt = select(Client).offset(offset).limit(limit)
    return db.scalars(stmt).all()

def update_client(db: Session, db_client: Client, client_update: ClientUpdate) -> Client:
    """Actualiza un cliente existente."""
    # Obtenemos solo los campos que tienen valor (no None)
    update_data = client_update.model_dump(exclude_unset=True) 
    
    for key, value in update_data.items():
        setattr(db_client, key, value)
        
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

def delete_client(db: Session, db_client: Client):
    """Borra un cliente."""
    db.delete(db_client)
    db.commit()

# ------------------------------
# Lógica de Consulta de Asignaciones (JOIN)
# ------------------------------

def get_assigned_clients_from_db(db: Session, salespeople_id: str, page: int, limit: int) -> List[Client]:
    """
    Busca los clientes asignados a un vendedor, aplicando paginación 
    (necesita un JOIN entre Client y ClientAssignment).
    """
    offset = (page - 1) * limit
    
    # Consulta: JOIN entre Client y ClientAssignment, filtrando por salespeople_id
    stmt = (
        select(Client)
        .join(Client.assignments)
        .where(ClientAssignment.salespeople_id == salespeople_id)
        .offset(offset)
        .limit(limit)
    )
    
    return db.scalars(stmt).all()

def create_assignment(db: Session, assignment: ClientAssignmentCreate) -> ClientAssignment:
    """Crea una nueva asignación de cliente a vendedor en la base de datos."""
    db_assignment = ClientAssignment(**assignment.model_dump())
    
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

def get_assignment_by_client_and_salesperson(
    db: Session, 
    client_id: str, 
    salespeople_id: str
) -> Optional[ClientAssignment]:
    """Verifica si ya existe una asignación para este cliente y vendedor."""
    stmt = (
        select(ClientAssignment)
        .where(
            and_(
                ClientAssignment.client_id == client_id,
                ClientAssignment.salespeople_id == salespeople_id
            )
        )
    )
    # db.scalar() devuelve el primer resultado o None
    return db.scalar(stmt)