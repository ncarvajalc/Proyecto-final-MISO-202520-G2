import uuid
from sqlalchemy import Column, String, Date, Text, ForeignKey, TIMESTAMP, func, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class Salespeople(Base):
    __tablename__ = "salespeople"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hire_date = Column(Date, nullable=False)
    status = Column(String(50), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    goals = relationship("SalespeopleGoal", back_populates="salespeople")

class SalesPlan(Base):
    __tablename__ = "sales_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plan_name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text)
    start_period = Column(Date, nullable=False)
    end_period = Column(Date, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    goals = relationship("SalespeopleGoal", back_populates="sales_plan")

class SalespeopleGoal(Base):
    __tablename__ = "salespeople_goals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sales_plan_id = Column(String(36), ForeignKey("sales_plans.id"), nullable=False)
    salespeople_id = Column(String(36), ForeignKey("salespeople.id"), nullable=False)
    goal_value = Column(Numeric(10, 2), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    sales_plan = relationship("SalesPlan", back_populates="goals")
    salespeople = relationship("Salespeople", back_populates="goals")
