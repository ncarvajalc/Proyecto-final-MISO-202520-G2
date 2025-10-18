"""Reports CRUD operations."""

from app.modules.reports.crud.informe_comercial_crud import (
    calculate_sales_indicators,
    create_informe_comercial,
    list_informes_comerciales_paginated,
)

__all__ = [
    "calculate_sales_indicators",
    "create_informe_comercial",
    "list_informes_comerciales_paginated",
]
