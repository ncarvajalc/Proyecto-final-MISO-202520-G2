
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime


class SalespeopleBase(BaseModel):
    full_name: str
    email: EmailStr
    hire_date: date
    status: str

class SalespeopleCreate(SalespeopleBase):
    pass

class SalespeopleUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    hire_date: Optional[date] = None
    status: Optional[str] = None

class Salespeople(SalespeopleBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True