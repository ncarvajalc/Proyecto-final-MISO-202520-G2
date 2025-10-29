import uuid
from enum import Enum
from pydantic import BaseModel, ConfigDict
from typing import Optional, List


class TerritoryType(str, Enum):
    COUNTRY = "COUNTRY"
    STATE = "STATE"
    CITY = "CITY"

class TerritoryBase(BaseModel):
    name: str
    type: TerritoryType
    id_parent: Optional[uuid.UUID] = None

class TerritoryCreate(TerritoryBase):
    pass

class TerritoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[TerritoryType] = None
    id_parent: Optional[uuid.UUID] = None

class Territory(TerritoryBase):
    id: uuid.UUID
    
    # Configuración para que Pydantic entienda los modelos de SQLAlchemy
    model_config = ConfigDict(from_attributes=True)

class TerritoryWithChildren(Territory):
    children: List['TerritoryWithChildren'] = []