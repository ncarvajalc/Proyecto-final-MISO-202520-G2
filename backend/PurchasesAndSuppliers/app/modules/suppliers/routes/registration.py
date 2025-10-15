"""Routes for individual supplier registration operations."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db

from ..models.orm import Supplier
from ..models.supplier import SupplierCreate
from ..services.serializers import supplier_to_dict


router = APIRouter(prefix="/proveedores", tags=["proveedores"])


@router.post("", status_code=status.HTTP_201_CREATED)
def register_supplier(payload: SupplierCreate, db: Session = Depends(get_db)):
    """Create a single supplier from the payload provided by the client."""

    existing = (
        db.query(Supplier)
        .filter(Supplier.id_tax == payload.id_tax)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un proveedor con el mismo id_tax",
        )

    supplier = Supplier(**payload.to_orm_kwargs())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    return supplier_to_dict(supplier)


__all__ = ["router"]
