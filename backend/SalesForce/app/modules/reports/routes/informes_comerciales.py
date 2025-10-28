"""API routes for Informes Comerciales."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.reports.schemas import (
    InformeComercial,
    InformeComercialCreate,
    InformeComercialPaginated,
)
from app.modules.reports.services import (
    create as create_informe,
    list_informes_comerciales,
)

router = APIRouter(prefix="/informes-comerciales", tags=["informes-comerciales"])


@router.post("/", response_model=InformeComercial, status_code=201)
def create_informe_comercial_endpoint(
    payload: InformeComercialCreate, db: Session = Depends(get_db)
):
    """
    Create a new commercial report.

    The report will automatically calculate and store sales indicators:
    - ventas_totales: Total sales value
    - unidades_vendidas: Total units sold

    These indicators are calculated from all available sales data at the
    time of report creation.
    """
    return create_informe(db, payload)


@router.get("/", response_model=InformeComercialPaginated)
def list_informes_comerciales_endpoint(
    page: int = 1, limit: int = 10, db: Session = Depends(get_db)
):
    """
    List commercial reports with pagination.

    Returns reports ordered by creation date (newest first).
    """
    return list_informes_comerciales(db, page=page, limit=limit)
