# models.py
from sqlalchemy import Column, String, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid
from app.core.database import Base



def generate_uuid():
    return str(uuid.uuid4())

class Client(Base):
    __tablename__ = "clients"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_name = Column(String(255), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relación back-populate con ClientAssignment
    assignments = relationship(
        "ClientAssignment", 
        back_populates="client",
        cascade="all, delete-orphan"
    )

class ClientAssignment(Base):
    """Representa la tabla 'ClientAssignment' (asignación de vendedor a cliente)."""
    __tablename__ = "client_assignments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    salespeople_id = Column(String(36), nullable=False)
    client_id = Column(String(36), ForeignKey("clients.id"), nullable=False)
    territory_id = Column(String(36), nullable=True)
    assignment_date = Column(Date, server_default=func.now())
    
    # Relaciones ORM
    client = relationship(
        "Client", 
        back_populates="assignments"
    )