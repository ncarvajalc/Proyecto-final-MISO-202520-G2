from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class SalespeopleGoalBase(BaseModel):
    sales_plan_id: str
    salespeople_id: str
    goal_value: Decimal

class SalespeopleGoalCreate(SalespeopleGoalBase):
    pass

class SalespeopleGoalUpdate(BaseModel):
    sales_plan_id: Optional[str] = None
    salespeople_id: Optional[str] = None
    goal_value: Optional[Decimal] = None

class SalespeopleGoal(SalespeopleGoalBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
