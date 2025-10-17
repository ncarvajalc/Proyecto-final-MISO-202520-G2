
import uuid
from sqlalchemy import (Column, String, Text, Boolean, DateTime, ForeignKey, Integer)
from sqlalchemy.types import DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Product(Base):
    __tablename__ = "products"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_name = Column(String(255), nullable=False)
    description = Column(Text)
    sku = Column(String(50), unique=True, nullable=False)
    price = Column(DECIMAL, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    technical_sheets = relationship("TechnicalSheet", back_populates="product")
    specifications = relationship("Specification", back_populates="product")
    upload_logs = relationship("UploadLogProduct", back_populates="product")

class TechnicalSheet(Base):
    __tablename__ = "technical_sheets"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    user_manual_url = Column(String(255))
    installation_guide_url = Column(String(255))
    certifications = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    product = relationship("Product", back_populates="technical_sheets")

class Specification(Base):
    __tablename__ = "specifications"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    name = Column(String(100), nullable=False)
    value = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    product = relationship("Product", back_populates="specifications")

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
    product_id = Column(String(36), ForeignKey("products.id"), nullable=True)
    row_number = Column(Integer, nullable=False)
    row_status = Column(String(50), nullable=False)
    error_message = Column(Text)
    log_date = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    upload_file = relationship("UploadFileProduct", back_populates="upload_logs")
    product = relationship("Product", back_populates="upload_logs")
