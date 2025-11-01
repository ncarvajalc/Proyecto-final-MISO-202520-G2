import uuid
from sqlalchemy import (
    Column,
    String,
    Date,
    Text,
    ForeignKey,
    TIMESTAMP,
    func,
    Numeric,
    Float,
    Integer
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.encryption import EncryptedString


class Salespeople(Base):
    __tablename__ = "salespeople"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(EncryptedString(512), nullable=False)
    email = Column(EncryptedString(512), unique=True, nullable=False, index=True)
    hire_date = Column(Date, nullable=False)
    status = Column(String(50), nullable=False)
    territory_id = Column(String(36), nullable=True, index=True)
    user_id = Column(String(36), nullable=True, index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    goals = relationship("SalespeopleGoal", back_populates="salespeople")
    sales_plans = relationship(
        "SalesPlan",
        back_populates="vendedor",
        cascade="all, delete-orphan",
    )


class SalesPlan(Base):
    __tablename__ = "sales_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    identificador = Column(String(100), unique=True, nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=False)
    periodo = Column(String(50), nullable=False)
    meta = Column(Float, nullable=False)
    vendedor_id = Column(String(36), ForeignKey("salespeople.id"), nullable=False)
    unidades_vendidas = Column(Float, nullable=False, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    vendedor = relationship("Salespeople", back_populates="sales_plans")
    goals = relationship("SalespeopleGoal", back_populates="sales_plan")

    @property
    def vendedor_nombre(self):
        if self.vendedor:
            return self.vendedor.full_name
        return None


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


class Route(Base):
    __tablename__ = "routes"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    salespeople_id = Column(String(36), nullable=False, index=True)
    day = Column(Date, nullable=False)
    done = Column(Integer, nullable=False)
