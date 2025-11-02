from sqlalchemy.orm import Session, joinedload

from ..models import salespeople_model as models
from ..schemas import dayroutes_schemas as schemas
from typing import List, Optional


def create_route(db: Session, route: schemas.RouteCreate) -> models.Route:
    """
    Crea una nueva ruta en la base de datos.
    El 'id' se genera automáticamente por el default de la columna.
    """
    db_route = models.Route(
        salespeople_id=route.salespeople_id,
        institution_id=route.institution_id,
        day=route.day,
        done=route.done
    )
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route

def get_route(db: Session, route_id: str) -> Optional[models.Route]:
    """
    Obtiene una ruta específica por su ID.
    """
    return db.query(models.Route).filter(models.Route.id == route_id).first()

def get_routes_by_salesperson(db: Session, salespeople_id: str, skip: int = 0, limit: int = 100) -> List[models.Route]:
    """
    Obtiene todas las rutas para un 'salespeople_id' específico.
    """
    return db.query(models.Route)\
             .filter(models.Route.salespeople_id == salespeople_id)\
             .offset(skip)\
             .limit(limit)\
             .all()

def get_routes_by_institution(db: Session, institution_id: str, skip: int = 0, limit: int = 100) -> List[models.Route]:
    """
    Obtiene todas las rutas para un 'salespeople_id' específico.
    """
    return db.query(models.Route)\
             .filter(models.Route.institution_id == institution_id)\
             .offset(skip)\
             .limit(limit)\
             .all()

def get_all_routes(db: Session, skip: int = 0, limit: int = 100) -> List[models.Route]:
    """
    Obtiene una lista paginada de todas las rutas.
    """
    return db.query(models.Route).offset(skip).limit(limit).all()

def get_all_missing_routes(db: Session, skip: int = 0, limit: int = 100) -> List[models.Route]:
    """
    Obtiene una lista paginada de todas las rutas.
    """
    return db.query(models.Route).filter(models.Route.done == 0).offset(skip).limit(limit).all()

def update_route(db: Session, route_id: str, route_update: schemas.RouteUpdate) -> Optional[models.Route]:
    """
    Actualiza una ruta existente.
    """
    db_route = get_route(db, route_id)
    if not db_route:
        return None

    # Obtiene los datos del schema que fueron explícitamente enviados (no None)
    update_data = route_update.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_route, key, value)
        
    db.commit()
    db.refresh(db_route)
    return db_route

def delete_route(db: Session, route_id: str) -> Optional[models.Route]:
    """
    Elimina una ruta de la base de datos.
    """
    db_route = get_route(db, route_id)
    if db_route:
        db.delete(db_route)
        db.commit()
        return db_route
    return None