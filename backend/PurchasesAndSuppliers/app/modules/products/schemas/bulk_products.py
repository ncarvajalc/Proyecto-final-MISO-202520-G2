
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
import uuid

# Base and Create Schemas
class SpecificationBase(BaseModel):
    name: str
    value: str

class SpecificationCreate(SpecificationBase):
    pass

class TechnicalSheetBase(BaseModel):
    user_manual_url: Optional[str] = None
    installation_guide_url: Optional[str] = None
    certifications: Optional[str] = None

class TechnicalSheetCreate(TechnicalSheetBase):
    pass

class ProductBase(BaseModel):
    product_name: str
    description: Optional[str] = None
    sku: str
    price: float
    is_active: bool = True

class ProductCreate(ProductBase):
    technical_sheet: Optional[TechnicalSheetCreate] = None
    specifications: Optional[List[SpecificationCreate]] = []

# Schemas for Reading Data (for API responses)
class Specification(SpecificationBase):
    id: uuid.UUID
    product_id: uuid.UUID

    class Config:
        orm_mode = True

class TechnicalSheet(TechnicalSheetBase):
    id: uuid.UUID
    product_id: uuid.UUID

    class Config:
        orm_mode = True

class Product(ProductBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    technical_sheets: List[TechnicalSheet] = []
    specifications: List[Specification] = []

    class Config:
        orm_mode = True

class UploadFileProduct(BaseModel):
    id: uuid.UUID
    file_name: str
    upload_status: str
    upload_date: datetime

    class Config:
        orm_mode = True

class UploadLogProduct(BaseModel):
    id: uuid.UUID
    row_number: int
    row_status: str
    error_message: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class UploadSummaryResponse(BaseModel):
    file_id: uuid.UUID
    status: str
    total_rows: int
    successful_rows: int
    failed_rows: int
    errors: List[UploadLogProduct] = []
