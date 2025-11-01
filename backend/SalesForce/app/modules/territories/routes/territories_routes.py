from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict

from ..schemas import territories_schemas as schemas
from ..services import territories_services as services
from app.core.database import get_db


router = APIRouter(
    prefix="/territorios",
    tags=["Territories"]
)


def get_territory_service() -> services.TerritoryService:
    return services.TerritoryService()


@router.post("/", response_model=schemas.Territory, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=schemas.Territory, status_code=status.HTTP_201_CREATED)
def create_territorio(
    territorio: schemas.TerritoryCreate,
    db: Session = Depends(get_db),
    service: services.TerritoryService = Depends(get_territory_service)
):
    """Crea un nuevo territorio."""
    return service.create(db, territorio=territorio)


@router.get("/", response_model=List[schemas.Territory])
@router.get("", response_model=List[schemas.Territory])
def read_territorios(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    service: services.TerritoryService = Depends(get_territory_service)
):
    """Obtiene una lista de territorios."""
    return service.get_all(db, skip=skip, limit=limit)


@router.get("/{territorio_id}", response_model=schemas.Territory)
def read_territorio(
    territorio_id: UUID,
    db: Session = Depends(get_db),
    service: services.TerritoryService = Depends(get_territory_service)
):
    """Obtiene un territorio específico por ID."""
    return service.get_by_id(db, territorio_id=territorio_id)


@router.put("/{territorio_id}", response_model=schemas.Territory)
def update_territorio(
    territorio_id: UUID,
    territorio_in: schemas.TerritoryUpdate,
    db: Session = Depends(get_db),
    service: services.TerritoryService = Depends(get_territory_service)
):
    """Actualiza un territorio."""
    return service.update(db, territorio_id=territorio_id, territorio_in=territorio_in)


@router.delete("/{territorio_id}", response_model=schemas.Territory)
def delete_territorio(
    territorio_id: UUID,
    db: Session = Depends(get_db),
    service: services.TerritoryService = Depends(get_territory_service)
):
    """Elimina un territorio."""
    return service.delete(db, territorio_id=territorio_id)


@router.get("/todos", response_model=List[schemas.TerritoryWithChildren])
def get_full_tree(
    db: Session = Depends(get_db),
    service: services.TerritoryService = Depends(get_territory_service)
):
    """
    Obtiene la estructura de árbol completa de todos los territorios, 
    empezando desde los nodos raíz (sin padre).
    """
    return service.get_full_tree(db)


@router.get("/{territorio_id}/hijos", response_model=List[schemas.Territory])
def get_territorio_children(
    territorio_id: UUID,
    db: Session = Depends(get_db),
    service: services.TerritoryService = Depends(get_territory_service)
):
    """Obtiene los hijos directos de un territorio."""
    return service.get_children(db, territorio_id=territorio_id)


@router.get("/{territorio_id}/linaje", response_model=List[schemas.Territory])
def get_territorio_lineage(
    territorio_id: UUID,
    db: Session = Depends(get_db),
    service: services.TerritoryService = Depends(get_territory_service)
):
    """
    Obtiene el linaje de un territorio (desde la raíz hasta él).
    Ej: [País, Estado, Ciudad]
    """
    return service.get_lineage(db, territorio_id=territorio_id)


@router.get("/{territorio_id}/descendientes", response_model=List[schemas.Territory])
def get_territorio_descendants(
    territorio_id: UUID,
    db: Session = Depends(get_db),
    service: services.TerritoryService = Depends(get_territory_service)
):
    """
    Obtiene TODOS los descendientes de un territorio (hijos, nietos, etc.)
    en una lista plana.
    """
    return service.get_all_descendants(db, territorio_id=territorio_id)


@router.post("/by-ids", response_model=List[schemas.Territory])
def read_territorios_by_ids_json(
    payload: schemas.TerritoryIdList,
    db: Session = Depends(get_db),
    service: services.TerritoryService = Depends(get_territory_service)
):
    """
    Obtiene una lista de territorios específicos por sus IDs, 
    recibiendo un body JSON con la lista de IDs.
    {
    "ids": [
        "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        ...
        ]
    }
    """
    return service.get_by_ids(db, territorio_ids=payload.ids)

@router.post(
    "/lineages-by-ids",
    response_model=Dict[str, List[schemas.Territory]],
    summary="Obtener linajes para múltiples Territorios"
)
def get_territorio_lineages_by_ids_endpoint(
    payload: schemas.TerritoryIdList,
    db: Session = Depends(get_db),
    service: services.TerritoryService = Depends(get_territory_service)
):
    """
    Recibe una lista de IDs de territorio y devuelve un diccionario 
    mapeando cada ID a su linaje (lista de ancestros, incluyéndose).
    """
    
    # Llama al método del servicio con los IDs del payload
    lineages_map = service.get_lineages_by_ids(
        db=db, 
        territorio_ids=payload.ids
    )
    
    # Devuelve el resultado. FastAPI usará el 'response_model'
    # para validar y serializar la salida.
    return lineages_map