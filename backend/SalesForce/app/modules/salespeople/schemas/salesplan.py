from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

class SalesPlanBase(BaseModel):
    plan_name: str
    description: Optional[str] = None
    start_period: date
    end_period: date

class SalesPlanCreate(SalesPlanBase):
    pass

class SalesPlanUpdate(BaseModel):
    plan_name: Optional[str] = None
    description: Optional[str] = None
    start_period: Optional[date] = None
    end_period: Optional[date] = None

class SalesPlan(SalesPlanBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)