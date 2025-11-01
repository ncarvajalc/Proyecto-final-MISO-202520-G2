"""CRUD operations for Informe Comercial."""

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.modules.reports.models import InformeComercial
from app.modules.reports.schemas import InformeComercialCreate
from app.modules.salespeople.models.salespeople_model import SalesPlan


def calculate_sales_indicators(db: Session) -> dict:
    """
    Calculate sales indicators from current sales data.

    Returns:
        dict with ventas_totales and unidades_vendidas

    Note: This calculates from SalesPlan data. In the future, this could
    be extended to calculate from actual sales transactions if that table
    is added to the system.
    """
    # Query to sum up all sales metrics from sales plans
    result = db.query(
        func.sum(SalesPlan.unidades_vendidas).label("total_unidades"),
        func.sum(SalesPlan.meta).label("total_meta"),
    ).first()

    unidades_vendidas = float(result.total_unidades or 0)
    # Use meta as a proxy for sales value (can be changed when real sales data exists)
    ventas_totales = float(result.total_meta or 0)

    return {
        "ventas_totales": round(ventas_totales, 2),
        "unidades_vendidas": round(unidades_vendidas, 2),
    }


def create_informe_comercial(
    db: Session, informe: InformeComercialCreate
) -> InformeComercial:
    """
    Create a new commercial report with calculated indicators.

    The indicators are calculated at the moment of creation and stored
    for historical reference.
    """
    # Calculate current indicators
    indicators = calculate_sales_indicators(db)

    # Create the report with calculated indicators
    db_informe = InformeComercial(
        nombre=informe.nombre,
        ventas_totales=indicators["ventas_totales"],
        unidades_vendidas=indicators["unidades_vendidas"],
    )

    db.add(db_informe)
    db.commit()
    db.refresh(db_informe)

    return db_informe


def list_informes_comerciales_paginated(db: Session, skip: int, limit: int) -> dict:
    """
    List commercial reports with pagination.

    Returns reports ordered by creation date (newest first).
    """
    query = db.query(InformeComercial).order_by(InformeComercial.fecha.desc())

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {"items": items, "total": total}
