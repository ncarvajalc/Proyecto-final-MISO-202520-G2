
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.proveedor import Proveedor
from app.schemas.proveedor_schema import ProveedorCreate, ProveedorOut
from fastapi_cache.decorator import cache
from fastapi import APIRouter, Depends, Query
from math import ceil
from app.models.proveedor import Certificado

router = APIRouter(prefix="/proveedores", tags=["Proveedores"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




@router.post("/", response_model=ProveedorOut)
def crear_proveedor(proveedor: ProveedorCreate, db: Session = Depends(get_db)):
    # Crear proveedor
    nuevo_proveedor = Proveedor(
        nombre=proveedor.nombre,
        id_tax=proveedor.id_tax,
        direccion=proveedor.direccion,
        telefono=proveedor.telefono,
        correo=proveedor.correo,
        contacto=proveedor.contacto,
        estado=proveedor.estado
    )

    # Crear certificado asociado
    certificado_data = proveedor.certificado
    nuevo_certificado = Certificado(
        nombre=certificado_data.nombre,
        cuerpoCertificador=certificado_data.cuerpoCertificador,
        fechaCertificacion=certificado_data.fechaCertificacion,
        fechaVencimiento=certificado_data.fechaVencimiento,
        urlDocumento=certificado_data.urlDocumento,
        proveedor=nuevo_proveedor  # vincula el certificado con el proveedor
    )

    db.add(nuevo_proveedor)
    db.add(nuevo_certificado)
    db.commit()
    db.refresh(nuevo_proveedor)
    return nuevo_proveedor





@router.get("/", response_model=dict)
@cache(expire=60)
def listar_proveedores(
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(10, ge=1, le=100, description="Registros por página"),
    db: Session = Depends(get_db)
):
    total = db.query(Proveedor).count()
    skip = (page - 1) * limit
    proveedores = db.query(Proveedor).offset(skip).limit(limit).all()
    total_pages = ceil(total / limit) if limit else 1

    return {
        "data": [ProveedorOut.model_validate(p) for p in proveedores],
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages
    }

