from sqlalchemy.orm import Session

from app.modules.visits.models import Visit
from app.modules.visits.schemas import VisitCreate


def list_visits_paginated(db: Session, skip: int, limit: int):
    """List all visits with pagination."""
    query = db.query(Visit).order_by(Visit.created_at.desc())

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {"items": items, "total": total}


def create_visit(db: Session, visit: VisitCreate):
    """Create a new visit."""
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
    db.commit()
    db.refresh(db_visit)
    return db_visit
