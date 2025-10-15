from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


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


class SalespersonPaginated(BaseModel):
    data: List[Salespeople]
    total: int
    page: int
    limit: int
    total_pages: int


# Esquemas para incluir información de planes de ventas
class SalesPlanInfo(BaseModel):
    """Información básica del plan de ventas"""
    id: str
    plan_name: str
    description: Optional[str] = None
    start_period: date
    end_period: date
    
    class Config:
        from_attributes = True


class SalespeopleGoalInfo(BaseModel):
    """Información del objetivo del vendedor con el plan asociado"""
    id: str
    sales_plan_id: str
    goal_value: Decimal
    created_at: datetime
    sales_plan: SalesPlanInfo
    
    class Config:
        from_attributes = True


class SalespeopleWithGoals(SalespeopleBase):
    """Vendedor con sus objetivos y planes de venta"""
    id: str
    created_at: datetime
    updated_at: datetime
    goals: List[SalespeopleGoalInfo] = []
    
    class Config:
        from_attributes = True