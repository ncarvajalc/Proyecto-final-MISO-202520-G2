from pydantic import BaseModel

class RouteResponse(BaseModel):
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
    # Usamos el modelo RouteResponse que ya teníamos
    routes: list[RouteResponse]