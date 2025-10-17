
import uuid
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship, synonym
from sqlalchemy.sql import func
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sku = Column(String(50), unique=True, nullable=False)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=False)
    precio = Column(Integer, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    especificaciones_json = Column(Text, nullable=True)
    hoja_tecnica_manual = Column(String(255), nullable=True)
    hoja_tecnica_instalacion = Column(String(255), nullable=True)
    hoja_tecnica_certificaciones = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Backwards compatible attribute names used by existing services
    product_name = synonym("nombre")
    description = synonym("descripcion")
    price = synonym("precio")
    is_active = synonym("activo")
    
    technical_sheets = relationship(
        "app.modules.products.models.bulk_products.TechnicalSheet",
        back_populates="product",
    )
    specifications = relationship(
        "app.modules.products.models.bulk_products.Specification",
        back_populates="product",
    )
    upload_logs = relationship(
        "app.modules.products.models.bulk_products.UploadLogProduct",
        back_populates="product",
    )

class TechnicalSheet(Base):
    __tablename__ = "technical_sheets"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_manual_url = Column(String(255))
    installation_guide_url = Column(String(255))
    certifications = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    product = relationship(
        "app.modules.products.models.bulk_products.Product",
        back_populates="technical_sheets",
    )

class Specification(Base):
    __tablename__ = "specifications"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    name = Column(String(100), nullable=False)
    value = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    product = relationship(
        "app.modules.products.models.bulk_products.Product",
        back_populates="specifications",
    )

class UploadFileProduct(Base):
    __tablename__ = "upload_files_products"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    upload_date = Column(DateTime, server_default=func.now())
    upload_status = Column(String(50), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    upload_logs = relationship("UploadLogProduct", back_populates="upload_file")

class UploadLogProduct(Base):
    __tablename__ = "upload_logs_products"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    file_id = Column(String(36), ForeignKey("upload_files_products.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    row_number = Column(Integer, nullable=False)
    row_status = Column(String(50), nullable=False)
    error_message = Column(Text)
    log_date = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    upload_file = relationship(
        "app.modules.products.models.bulk_products.UploadFileProduct",
        back_populates="upload_logs",
    )
    product = relationship(
        "app.modules.products.models.bulk_products.Product",
        back_populates="upload_logs",
    )
