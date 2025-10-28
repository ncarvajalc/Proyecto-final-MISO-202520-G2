"""Business logic for Informe Comercial operations."""

from sqlalchemy.orm import Session

from app.core.pagination import build_pagination_metadata, get_pagination_offset
from app.modules.reports.crud import (
    create_informe_comercial,
    list_informes_comerciales_paginated,
)
from app.modules.reports.schemas import (
    InformeComercial,
    InformeComercialCreate,
    InformeComercialPaginated,
)


def create(db: Session, informe: InformeComercialCreate) -> InformeComercial:
    """
    Create a new commercial report.

    The report automatically calculates and stores:
    - ventas_totales: Sum of all sales values
    - unidades_vendidas: Sum of all units sold
    """
    created = create_informe_comercial(db, informe)
    return InformeComercial.model_validate(created)


def list_informes_comerciales(
    db: Session, page: int = 1, limit: int = 10
) -> InformeComercialPaginated:
    """
    List commercial reports with pagination.

    Returns reports ordered by creation date (newest first).
    """
    skip = get_pagination_offset(page, limit)
    result = list_informes_comerciales_paginated(db, skip=skip, limit=limit)

    total = result["total"]
    informes = [InformeComercial.model_validate(item) for item in result["items"]]

    metadata = build_pagination_metadata(total=total, page=page, limit=limit)

    return InformeComercialPaginated(data=informes, **metadata)
