"""Informe Comercial model for commercial reports with sales indicators."""

import uuid
from sqlalchemy import Column, String, TIMESTAMP, Float, func

from app.core.database import Base


class InformeComercial(Base):
    """
    Commercial report model that stores sales indicators at a point in time.
    
    Indicators are calculated from sales data when the report is created and
    stored for historical reference.
    """
    __tablename__ = "informes_comerciales"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = Column(String(255), nullable=False)
    fecha = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    ventas_totales = Column(Float, nullable=False, default=0.0)
    unidades_vendidas = Column(Float, nullable=False, default=0.0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

