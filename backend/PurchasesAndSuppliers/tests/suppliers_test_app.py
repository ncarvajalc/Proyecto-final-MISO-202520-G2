import os
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

# Ensure that the application uses the SQLite database that is configured for tests
os.environ.setdefault("TESTING", "1")

from app.core.database import get_db  # noqa: E402  (import after env configuration)
from app.modules.suppliers.models import SupplierCreate, SupplierCertificate  # noqa: E402
from app.modules.suppliers.models.orm import Supplier  # noqa: E402
from app.modules.suppliers.services.serializers import supplier_to_dict  # noqa: E402

router = APIRouter(prefix="/api/proveedores", tags=["proveedores"])


@router.post("", status_code=status.HTTP_201_CREATED)
def register_supplier(
    payload: SupplierCreate, db: Session = Depends(get_db)
):
    supplier = Supplier(**payload.to_orm_kwargs())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier_to_dict(supplier)


__all__ = [
    "Supplier",
    "SupplierCreate",
    "SupplierCertificate",
    "router",
    "supplier_to_dict",
]
