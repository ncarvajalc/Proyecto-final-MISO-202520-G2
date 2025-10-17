import json
import os
from typing import List, Optional

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, HttpUrl, ValidationError, conint, constr, field_validator
from sqlalchemy import Boolean, Column, Integer, String, Text
from sqlalchemy.orm import Session

os.environ.setdefault("TESTING", "1")

from app.core.database import Base, get_db  # noqa: E402


class Product(Base):
    """Simple SQLAlchemy model used only for product registration tests."""

    __tablename__ = "products"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, nullable=False, unique=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(String, nullable=False)
    precio = Column(Integer, nullable=False)
    activo = Column(Boolean, nullable=False, default=True)
    especificaciones_json = Column(Text, nullable=True)
    hoja_tecnica_manual = Column(String, nullable=True)
    hoja_tecnica_instalacion = Column(String, nullable=True)
    hoja_tecnica_certificaciones = Column(Text, nullable=True)


class ProductSpecification(BaseModel):
    nombre: constr(min_length=1)  # type: ignore[valid-type]
    valor: constr(min_length=1)  # type: ignore[valid-type]


class ProductTechnicalSheet(BaseModel):
    urlManual: Optional[HttpUrl] = None
    urlHojaInstalacion: Optional[HttpUrl] = None
    certificaciones: Optional[List[constr(min_length=1)]] = None  # type: ignore[valid-type]

    @field_validator("certificaciones", mode="before")
    def _normalize_certificaciones(cls, value: Optional[List[str]]) -> Optional[List[str]]:
        if value in (None, [], ""):
            return None
        return [item for item in value if item]

    def is_empty(self) -> bool:
        certificaciones = self.certificaciones or []
        return not any([
            self.urlManual,
            self.urlHojaInstalacion,
            certificaciones,
        ])

    def to_response(self) -> Optional[dict]:
        if self.is_empty():
            return None
        return {
            "urlManual": str(self.urlManual) if self.urlManual else None,
            "urlHojaInstalacion": str(self.urlHojaInstalacion)
            if self.urlHojaInstalacion
            else None,
            "certificaciones": self.certificaciones or None,
        }


class ProductCreate(BaseModel):
    sku: constr(min_length=1)  # type: ignore[valid-type]
    nombre: constr(min_length=1)  # type: ignore[valid-type]
    descripcion: constr(min_length=1)  # type: ignore[valid-type]
    precio: conint(gt=0)  # type: ignore[valid-type]
    activo: bool = True
    especificaciones: Optional[List[ProductSpecification]] = None
    hojaTecnica: Optional[ProductTechnicalSheet] = None

    @field_validator("hojaTecnica", mode="before")
    def _normalize_hoja_tecnica(
        cls, value: Optional[dict]
    ) -> Optional[ProductTechnicalSheet]:
        if value in (None, "", {}):
            return None
        if isinstance(value, ProductTechnicalSheet):
            return value
        try:
            return ProductTechnicalSheet(**value)
        except (TypeError, ValidationError) as exc:  # pragma: no cover - defensive
            raise exc

    def to_orm_kwargs(self) -> dict:
        especificaciones = [spec.model_dump() for spec in self.especificaciones or []]
        hoja_tecnica = self.hojaTecnica
        hoja_tecnica_dict = hoja_tecnica.to_response() if hoja_tecnica else None

        return {
            "sku": self.sku,
            "nombre": self.nombre,
            "descripcion": self.descripcion,
            "precio": int(self.precio),
            "activo": self.activo,
            "especificaciones_json": json.dumps(especificaciones)
            if especificaciones
            else None,
            "hoja_tecnica_manual": hoja_tecnica_dict.get("urlManual")
            if hoja_tecnica_dict
            else None,
            "hoja_tecnica_instalacion": hoja_tecnica_dict.get("urlHojaInstalacion")
            if hoja_tecnica_dict
            else None,
            "hoja_tecnica_certificaciones": json.dumps(
                hoja_tecnica_dict.get("certificaciones")
            )
            if hoja_tecnica_dict and hoja_tecnica_dict.get("certificaciones")
            else None,
        }


def product_to_dict(product: Product) -> dict:
    especificaciones = (
        json.loads(product.especificaciones_json)
        if product.especificaciones_json
        else None
    )

    certificaciones = (
        json.loads(product.hoja_tecnica_certificaciones)
        if product.hoja_tecnica_certificaciones
        else None
    )

    hoja_tecnica = None
    if any(
        [
            product.hoja_tecnica_manual,
            product.hoja_tecnica_instalacion,
            certificaciones,
        ]
    ):
        hoja_tecnica = {
            "urlManual": product.hoja_tecnica_manual,
            "urlHojaInstalacion": product.hoja_tecnica_instalacion,
            "certificaciones": certificaciones,
        }

    return {
        "id": product.id,
        "sku": product.sku,
        "nombre": product.nombre,
        "descripcion": product.descripcion,
        "precio": product.precio,
        "activo": product.activo,
        "especificaciones": especificaciones,
        "hojaTecnica": hoja_tecnica,
    }


router = APIRouter(prefix="/api/productos", tags=["productos"])


@router.post("", status_code=status.HTTP_201_CREATED)
def register_product(payload: ProductCreate, db: Session = Depends(get_db)):
    product = Product(**payload.to_orm_kwargs())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product_to_dict(product)


__all__ = [
    "Product",
    "ProductCreate",
    "ProductSpecification",
    "ProductTechnicalSheet",
    "router",
    "product_to_dict",
]
