from sqlalchemy.orm import Session
from sqlalchemy import text
from uuid import UUID
from ..models import territories_model as models
from ..schemas import territories_schemas as schemas

def get_territorio(db: Session, territorio_id: UUID) -> models.Territorio | None:
    """Obtiene un territorio por su ID."""
    return db.query(models.Territorio).filter(models.Territorio.id == territorio_id).first()

def get_territorios(db: Session, skip: int = 0, limit: int = 100) -> list[models.Territorio]:
    """Obtiene una lista paginada de territorios."""
    return db.query(models.Territorio).offset(skip).limit(limit).all()

def create_territorio(db: Session, territorio: schemas.TerritoryCreate) -> models.Territorio:
    """Crea un nuevo territorio en la BD."""
    db_territorio = models.Territorio(**territorio.model_dump())
    db.add(db_territorio)
    db.commit()
    db.refresh(db_territorio)
    return db_territorio

def update_territorio(
    db: Session, 
    db_territorio: models.Territorio, 
    territorio_in: schemas.TerritoryUpdate
) -> models.Territorio:
    """Actualiza un territorio existente."""
    update_data = territorio_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_territorio, key, value)
    
    db.add(db_territorio)
    db.commit()
    db.refresh(db_territorio)
    return db_territorio

def delete_territorio(db: Session, db_territorio: models.Territorio) -> models.Territorio:
    """Elimina un territorio."""
    db.delete(db_territorio)
    db.commit()
    return db_territorio

def get_root_territorios(db: Session) -> list[models.Territorio]:
    """Obtiene todos los territorios raíz (los que no tienen padre)."""
    return db.query(models.Territorio).filter(models.Territorio.id_parent == None).all()


def get_territorio_descendants(db: Session, territorio_id: UUID) -> list[models.Territorio]:
    """
    Obtiene el territorio consultado Y TODOS sus descendientes (hijos, nietos, etc.)
    usando una única Consulta Recursiva (CTE).
    Devuelve una lista plana.
    """
    
    sql_query = text("""
        WITH RECURSIVE descendants AS (
            -- 1. Caso Base (Ancla):
            -- Selecciona el nodo raíz (el territorio consultado)
            SELECT *
            FROM territorios
            WHERE id = :territorio_id

            UNION ALL 

            -- 2. Paso Recursivo:
            -- Busca los hijos (t) de los nodos (d) 
            -- ya encontrados en el conjunto 'descendants'.
            SELECT t.*
            FROM territorios t
            JOIN descendants d ON t.id_parent = d.id
        )
        -- 3. Resultado final:
        -- Devuelve todos los nodos (raíz + descendientes)
        SELECT * FROM descendants;
    """)

    descendants = db.query(models.Territorio).from_statement(sql_query).params(
        territorio_id=territorio_id
    ).all()
    
    return descendants