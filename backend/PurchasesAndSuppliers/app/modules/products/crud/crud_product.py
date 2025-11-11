"""CRUD operations for product domain."""

from __future__ import annotations

from sqlalchemy.orm import Session, joinedload

from ..models.bulk_products import Product, Specification, TechnicalSheet
from ..schemas.product import ProductCreate


def get_product(db: Session, product_id: int) -> Product | None:
    """Get product by ID with related data loaded."""
    return (
        db.query(Product)
        .options(
            joinedload(Product.technical_sheets), joinedload(Product.specifications)
        )
        .filter(Product.id == product_id)
        .first()
    )


def get_product_by_sku(db: Session, sku: str) -> Product | None:
    """Get product by SKU."""
    return db.query(Product).filter(Product.sku == sku).first()


def get_products_all(db: Session, skip: int = 0, limit: int = 10) -> dict:
    """List all products with pagination."""
    total = db.query(Product).count()
    products = (
        db.query(Product)
        .options(
            joinedload(Product.technical_sheets), joinedload(Product.specifications)
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {"products": products, "total": total}


def get_products_by_ids(db: Session, product_ids: list[int]) -> list[Product]:
    """Get multiple products by a list of IDs."""
    return (
        db.query(Product)
        .options(
            joinedload(Product.technical_sheets), joinedload(Product.specifications)
        )
        .filter(Product.id.in_(product_ids))
        .all()
    )


def create_product(db: Session, product: ProductCreate) -> Product:
    """Create a new product with specifications and technical sheet."""
    # Create product
    db_product = Product(
        sku=product.sku,
        nombre=product.nombre,
        descripcion=product.descripcion,
        precio=product.precio,
        activo=product.activo,
    )
    db.add(db_product)
    db.flush()  # Get ID before commit

    # Create technical sheet if provided
    if product.hojaTecnica:
        tech_sheet = TechnicalSheet(
            product_id=db_product.id,
            user_manual_url=product.hojaTecnica.urlManual,
            installation_guide_url=product.hojaTecnica.urlHojaInstalacion,
            certifications=(
                ",".join(product.hojaTecnica.certificaciones)
                if product.hojaTecnica.certificaciones
                else None
            ),
        )
        db.add(tech_sheet)

    # Create specifications if provided
    if product.especificaciones:
        for spec in product.especificaciones:
            specification = Specification(
                product_id=db_product.id, name=spec.nombre, value=spec.valor
            )
            db.add(specification)

    db.commit()
    db.refresh(db_product)
    return db_product


__all__ = [
    "get_product",
    "get_product_by_sku",
    "get_products_all",
    "get_products_by_ids",
    "create_product",
]
