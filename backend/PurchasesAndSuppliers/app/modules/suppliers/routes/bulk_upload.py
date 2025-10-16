"""Routes for suppliers bulk upload."""

from __future__ import annotations

import math
from typing import Any, Dict

from fastapi import (
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db

from ..models.orm import Supplier
from ..services.bulk_upload import process_bulk_upload
from ..services.serializers import supplier_to_dict
from .shared import router


@router.post("/bulk-upload", status_code=status.HTTP_201_CREATED)
async def bulk_upload_suppliers(
    file: UploadFile = File(..., description="Archivo CSV con proveedores"),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe tener extensión .csv",
        )

    try:
        return process_bulk_upload(db, file)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("")
def list_suppliers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    query = db.query(Supplier).order_by(Supplier.id)
    total = query.count()
    offset = (page - 1) * limit
    suppliers = query.offset(offset).limit(limit).all()

    data = [supplier_to_dict(supplier) for supplier in suppliers]
    total_pages = math.ceil(total / limit) if total else 0

    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages,
    }


__all__ = ["router"]
