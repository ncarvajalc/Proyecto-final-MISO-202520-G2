from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.visits.schemas import Visit, VisitCreate, VisitsResponse
from app.modules.visits.services import create as create_visit, list_visits

router = APIRouter(prefix="/visitas", tags=["visitas"])


@router.post("/", response_model=Visit)
def create_visit_endpoint(payload: VisitCreate, db: Session = Depends(get_db)):
    return create_visit(db, payload)


@router.get("/", response_model=VisitsResponse)
def list_visits_endpoint(
    page: int = 1, limit: int = 10, db: Session = Depends(get_db)
):
    return list_visits(db, page=page, limit=limit)
