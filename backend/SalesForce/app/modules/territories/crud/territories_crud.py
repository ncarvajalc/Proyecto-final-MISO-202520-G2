from sqlalchemy.orm import Session, aliased
from sqlalchemy import text, select, func, literal
from uuid import UUID
from typing import List, Dict
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

def get_lineages_for_multiple_territories(
    db: Session, territorio_ids: List[UUID]
) -> Dict[str, List[models.Territorio]]:
    """
    Obtiene el linaje (ancestros) para MÚLTIPLES territorios en una sola 
    consulta CTE recursiva.
    
    Devuelve un diccionario: { "territorio_id_original": [lista_de_ancestros] }
    """
    if not territorio_ids:
        return {}

    Territorio = models.Territorio
    t_alias = aliased(Territorio)
    
    # Convertir UUIDs a strings para la query SQL
    str_ids = [str(tid) for tid in territorio_ids]

    #    Los territorios iniciales que buscamos.
    #    Guardamos 'original_id' para saber a quién pertenece cada ancestro.
    cte = (
        select(
            Territorio.id.label("original_id"),
            Territorio.id,
            Territorio.name,
            Territorio.id_parent,
            literal(0).label("level") # Nivel 0 (el hijo)
        )
        .where(Territorio.id.in_(str_ids))
        .cte("lineage_cte", recursive=True)
    )

    #    Unir el CTE consigo mismo para encontrar los padres (t_alias).
    cte = cte.union_all(
        select(
            cte.c.original_id, # Propagamos el ID original
            t_alias.id,
            t_alias.name,
            t_alias.id_parent,
            (cte.c.level + 1).label("level")
        )
        .join(cte, cte.c.id_parent == t_alias.id) # Unimos el padre del CTE con el ID del alias
    )

    #    Seleccionamos los objetos Territorio completos, uniéndolos con nuestro CTE.
    #    Ordenamos por 'original_id' y luego por 'level' descendente 
    #    para que el linaje venga [Raíz, ..., Hijo].
    query = (
        select(Territorio, cte.c.original_id)
        .join(cte, Territorio.id == cte.c.id)
        .order_by(cte.c.original_id, cte.c.level.desc())
    )

    # Ejecutamos la consulta
    results_with_meta = db.execute(query).all()

    #    Agrupamos los resultados (que vienen "planos") en un diccionario.
    final_lineages: Dict[str, List[models.Territorio]] = {tid: [] for tid in str_ids}
    
    for (territorio_obj, original_id) in results_with_meta:
        # El original_id es un string, nos aseguramos de usarlo como clave
        final_lineages[str(original_id)].append(territorio_obj)

    return final_lineages

def get_territorios_by_ids(db: Session, territorio_ids: List[UUID]) -> List[models.Territorio]:
    """
    Obtiene una lista de territorios que coinciden con los IDs 
    proporcionados, usando una consulta 'IN'.
    """
    if not territorio_ids:
        return [] # Evita una consulta innecesaria si la lista está vacía

    return db.query(models.Territorio).filter(
        models.Territorio.id.in_(territorio_ids)
    ).all()