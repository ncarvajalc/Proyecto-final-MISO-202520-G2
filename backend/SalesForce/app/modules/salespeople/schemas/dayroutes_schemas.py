from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional

# --- Schema Base ---
# Campos comunes que se comparten
class RouteBase(BaseModel):
    salespeople_id: str
    institution_id: str
    day: date
    done: int

# --- Schema para Creación ---
# Se usa al recibir datos en un POST
class RouteCreate(RouteBase):
    pass  # Hereda todos los campos y todos son requeridos

# --- Schema para Actualización ---
# Se usa al recibir datos en un PUT/PATCH
# Todos los campos son opcionales
class RouteUpdate(BaseModel):
    salespeople_id: Optional[str] = None
    institution_id: Optional[str] = None
    day: Optional[date] = None
    done: Optional[int] = None

# --- Schema para Lectura ---
# El modelo que se enviará de vuelta al cliente (GET)
# Incluye el 'id' y habilita el 'orm_mode'
class Route(RouteBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

class RouteResponse(BaseModel):
    id: str
    nombreEntidad: str
    tiempo: str
    distancia: str
    pais: str
    ciudad: str
    direccion: str

class RouteGoogleResponse(BaseModel):
    origin: str
    destination: str
    distance_text: str
    duration_text: str
    distance_meters: int
    duration_seconds: int

class MultipleRouteRequest(BaseModel):
    origin_lat: float
    origin_lon: float
    # Ahora esperamos una LISTA de direcciones
    destination_addresses: list[str] 

# La respuesta será una lista de las respuestas individuales
class MultipleRouteResponse(BaseModel):
    total_routes_found: int
    total_routes_requested: int
    # Devolvemos ahora la lista de RouteResponse (id + datos de institución y tiempos/distancias)
    routes: list[RouteResponse]