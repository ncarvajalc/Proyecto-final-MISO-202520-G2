# schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# --- Schemas de Entrada (Petición) ---

class ClientCreate(BaseModel):
    """Schema para la creación de un nuevo cliente."""
    company_name: str = Field(..., max_length=255)
    address: str = Field(..., max_length=255)
    city: str = Field(..., max_length=100)
    country: str = Field(..., max_length=100)

class ClientUpdate(BaseModel):
    """Schema para la actualización de un cliente (todos los campos opcionales)."""
    company_name: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)

# --- Schemas de Salida (Respuesta) ---

class ClientBase(BaseModel):
    """Schema base de un cliente, incluyendo su ID y timestamps."""
    id: str
    company_name: str
    address: str
    city: str
    country: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        
class ClientAssignedDetail(BaseModel):
    # Usamos alias para mapear company_name de la DB a 'name' en la respuesta
    name: str = Field(..., alias="company_name", description="Nombre del cliente")
    country: str = Field(..., description="País del cliente")
    city: str = Field(..., description="Ciudad del cliente")
    address: str = Field(..., description="Dirección completa del cliente")

    class Config:
        from_attributes = True
        allow_population_by_field_name = True

class ClientListResponse(BaseModel):
    """Schema para la respuesta de la lista de clientes asignados (paginada)."""
    salespeople_id: str
    clients: List[ClientAssignedDetail]


class ClientAssignmentCreate(BaseModel):
    """Schema para crear una nueva asignación de cliente a vendedor."""
    salespeople_id: str = Field(..., max_length=36, description="ID del vendedor")
    client_id: str = Field(..., max_length=36, description="ID del cliente a asignar")
    territory_id: Optional[str] = Field(None, max_length=36, description="ID opcional del territorio")

# --- Schema de Asignación de Salida ---

class ClientAssignmentBase(ClientAssignmentCreate):
    """Schema base de una asignación, incluyendo su ID y fecha."""
    id: str
    assignment_date: datetime

    class Config:
        from_attributes = True