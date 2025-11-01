from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException, status
from typing import List, Dict
from ..crud import territories_crud as crud
from ..models import territories_model as models
from ..schemas import territories_schemas as schemas

class TerritoryService:
    
    def get_by_id(self, db: Session, territorio_id: UUID) -> models.Territorio:
        """Obtiene un territorio, lanza 404 si no existe."""
        db_territorio = crud.get_territorio(db, territorio_id=territorio_id)
        if not db_territorio:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Territorio no encontrado")
        return db_territorio

    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> list[models.Territorio]:
        """Obtiene todos los territorios."""
        return crud.get_territorios(db, skip=skip, limit=limit)

    def create(self, db: Session, territorio: schemas.TerritoryCreate) -> models.Territorio:
        """Crea un territorio, validando la lógica de negocio."""
        
        # Regla 1: Validar que el padre (si se provee) exista
        if territorio.id_parent:
            parent = self.get_by_id(db, territorio.id_parent) # Reusa get_by_id para el chequeo 404
            
            # Aquí podrías añadir más reglas (ej. un CITY no puede ser hijo de un COUNTRY)
            if parent.type == schemas.TerritoryType.COUNTRY and territorio.type != schemas.TerritoryType.STATE:
                 raise HTTPException(
                     status_code=status.HTTP_400_BAD_REQUEST, 
                     detail="Un COUNTRY solo puede tener hijos de tipo STATE"
                 )

        # Regla 2: Un COUNTRY no debería tener padre (cabezas del árbol)
        if territorio.type in [schemas.TerritoryType.COUNTRY] and territorio.id_parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{territorio.type} no puede tener un padre."
            )
            
        return crud.create_territorio(db, territorio=territorio)

    def update(self, db: Session, territorio_id: UUID, territorio_in: schemas.TerritoryUpdate) -> models.Territorio:
        """Actualiza un territorio."""
        db_territorio = self.get_by_id(db, territorio_id)
        
        # Regla 3: Validar que el nuevo padre (si cambia) exista
        if territorio_in.id_parent and territorio_in.id_parent != db_territorio.id_parent:
            self.get_by_id(db, territorio_in.id_parent) # Valida que el nuevo padre exista

        # Regla 4: No puedes hacer que un territorio sea su propio padre
        if territorio_in.id_parent == territorio_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un territorio no puede ser su propio padre."
            )

        return crud.update_territorio(db, db_territorio=db_territorio, territorio_in=territorio_in)

    def delete(self, db: Session, territorio_id: UUID) -> models.Territorio:
        """Elimina un territorio."""
        db_territorio = self.get_by_id(db, territorio_id)
        
        if db_territorio.children:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede eliminar un territorio que tiene hijos."
            )

        return crud.delete_territorio(db, db_territorio=db_territorio)


    def get_children(self, db: Session, territorio_id: UUID) -> list[models.Territorio]:
        """Obtiene los hijos directos de un territorio."""
        db_territorio = self.get_by_id(db, territorio_id)
        return db_territorio.children

    def get_lineage(self, db: Session, territorio_id: UUID) -> list[models.Territorio]:
        """Obtiene el linaje (padre, abuelo, etc.) hasta la raíz."""
        linaje = []
        current = self.get_by_id(db, territorio_id)
        
        while current:
            linaje.append(current)
            # Gracias a la relación 'parent' de SQLAlchemy, esto es fácil
            current = current.parent 
            
        return list(reversed(linaje)) # Devolvemos [País, Estado, Ciudad]

    def get_full_tree(self, db: Session) -> list[models.Territorio]:
        """Obtiene el árbol completo desde las raíces."""
        return crud.get_root_territorios(db)
    

    def get_all_descendants(self, db: Session, territorio_id: UUID) -> list[models.Territorio]:
        """
        Obtiene todos los descendientes (hijos, nietos, etc.) de un territorio.
        Devuelve una lista plana.
        """

        # Reutilizamos get_by_id, que ya lanza un 404 si no se encuentra
        self.get_by_id(db, territorio_id) 
        
        # Llamar a la función CRUD que hace la consulta recursiva
        return crud.get_territorio_descendants(db, territorio_id=territorio_id)
    

    def get_by_ids(self, db: Session, territorio_ids: List[UUID]) -> List[models.Territorio]:
        """
        Obtiene múltiples territorios por su ID.
        Los IDs no encontrados simplemente se omiten.
        """
        return crud.get_territorios_by_ids(db, territorio_ids=territorio_ids)
    
    def get_lineages_by_ids(
        self, db: Session, territorio_ids: List[UUID]
    ) -> Dict[str, List[models.Territorio]]:
        """
        Obtiene los linajes completos para una lista de IDs de territorio.
        
        Devuelve un diccionario donde cada clave es el ID de territorio solicitado
        y el valor es una lista de sus ancestros (incluyéndose).
        Ej: { "id_bogota": [Territorio(Colombia), Territorio(Cund), Territorio(Bogota)] }
        """
        # Los IDs no encontrados simplemente devolverán un array vacío en el dict
        
        # Llamamos a la función optimizada del CRUD
        lineages_map = crud.get_lineages_for_multiple_territories(
            db, territorio_ids=territorio_ids
        )
        
        return lineages_map