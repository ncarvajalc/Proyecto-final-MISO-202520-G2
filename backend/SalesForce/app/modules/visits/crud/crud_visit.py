from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from app.modules.visits.models import Visit, VisitMultimedia
from app.modules.visits.schemas import VisitCreate


def list_visits_paginated(db: Session, skip: int, limit: int):
    """List all visits with pagination."""
    query = db.query(Visit).options(joinedload(Visit.multimedia)).order_by(Visit.created_at.desc())

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {"items": items, "total": total}


def create_visit(db: Session, visit: VisitCreate, multimedia_data: Optional[List[dict]] = None):
    """Create a new visit with optional multimedia files."""
    # Create the visit
    db_visit = Visit(
        nombre_institucion=visit.nombre_institucion,
        direccion=visit.direccion,
        hora=visit.hora,
        desplazamiento_minutos=visit.desplazamiento_minutos,
        hora_salida=visit.hora_salida,
        estado=visit.estado,
        observacion=visit.observacion,
    )
    db.add(db_visit)
    db.flush()  # Flush to get the visit ID without committing

    # Create multimedia records if files were provided
    if multimedia_data:
        for media in multimedia_data:
            db_multimedia = VisitMultimedia(
                visit_id=db_visit.id,
                file_name=media["file_name"],
                file_type=media["file_type"],
                file_size=media["file_size"],
                file_data=media["file_data"]
            )
            db.add(db_multimedia)

    db.commit()
    # Refresh with multimedia relationship loaded
    db.refresh(db_visit)
    db_visit = db.query(Visit).options(joinedload(Visit.multimedia)).filter(Visit.id == db_visit.id).first()
    return db_visit
