from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import googlemaps
import os
from ..crud.crud_dayroutes import get_dayroute_bd
from ..schemas.dayroutes_schemas import  RouteResponse, MultipleRouteResponse

def get_dayroute(db: Session, salespeople_id: str, latitud: float, longitud: float):
    try:
        # 1. Llama a tu nueva lógica de negocio
        destino=[
            "Plaza de Cataluña, Barcelona, España",
            "Plaza del Ayuntamiento, Valencia, España",
            "Plaza Mayor, Salamanca, España",
            "Calle felipe II 29, Parla, España"
        ]
        route_data_list_of_dicts = get_multiple_routes_data(
            origin_lat=latitud,
            origin_lon=longitud,
            destination_addresses=destino
        )

        # 2. Convertimos la lista de diccionarios en una lista de RouteResponse
        # Filtramos solo las que se encontraron (status "OK")
        found_routes = [
            RouteResponse(**data) for data in route_data_list_of_dicts 
            if data["distance_meters"] > 0
        ]
        
        # 3. Devolvemos la respuesta estructurada
        return MultipleRouteResponse(
            total_routes_found=len(found_routes),
            total_routes_requested=len(destino),
            routes=found_routes
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except googlemaps.exceptions.ApiError as e:
        raise HTTPException(status_code=400, detail=f"Error al contactar la API de Google: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")
    #return get_dayroute_bd(db, salespeople_id=salespeople_id)
    

def get_multiple_routes_data(origin_lat: float, origin_lon: float, destination_addresses: list[str]) -> list[dict]:
    """
    Función de lógica de negocio para calcular la ruta.
    Devuelve un diccionario con los datos o lanza una excepción.
    """
    API_KEY= os.environ.get("API_KEY_GOOGLE")
    try:
        gmaps = googlemaps.Client(key=API_KEY)
    except ValueError:
        print("Error: La API Key no es válida o está ausente.")
        # En un caso real, no deberías iniciar la app si la clave falta
        # Para este ejemplo, la app iniciará pero fallará en las peticiones.
        gmaps = None
    if gmaps is None:
        raise HTTPException(
            status_code=500, 
            detail="El servidor no está configurado correctamente (falta API Key)."
        )

    if gmaps is None:
        # Esto es un error de configuración del servidor
        raise ValueError("Error de servidor: Cliente de Google Maps no inicializado.")

    origin = (origin_lat, origin_lon)
    try:
        # ¡Aquí está el cambio! Usamos distance_matrix
        matrix_result = gmaps.distance_matrix(origins=[origin],
                                              destinations=destination_addresses,
                                              mode="driving",
                                              departure_time=datetime.now())

        # La respuesta es una matriz. Como solo tenemos 1 origen,
        # solo nos interesa la primera (y única) "fila" (row).
        
        # 'rows' es una lista con 1 elemento (nuestro origen)
        if not matrix_result or 'rows' not in matrix_result or not matrix_result['rows']:
            raise ValueError("Respuesta inesperada de la API de Distance Matrix")

        elements = matrix_result['rows'][0]['elements']
        
        # 'elements' es una lista que corresponde a cada destino
        # Ejs: elements[0] es la ruta a destination_addresses[0]
        #      elements[1] es la ruta a destination_addresses[1]
        
        results_list = []
        
        # Iteramos sobre los destinos y sus resultados
        for i, element in enumerate(elements):
            
            # El "status" del elemento nos dice si se encontró esa ruta
            if element['status'] == 'OK':
                results_list.append({
                    # Obtenemos la dirección original que enviamos
                    "origin": matrix_result['origin_addresses'][0], 
                    # Obtenemos la dirección que Google encontró (ya "geocodificada")
                    "destination": matrix_result['destination_addresses'][i], 
                    "distance_text": element['distance']['text'],
                    "duration_text": element['duration']['text'],
                    "distance_meters": element['distance']['value'],
                    "duration_seconds": element['duration']['value']
                })
            else:
                # Si no se encontró (ej: "NOT_FOUND"), guardamos un marcador
                results_list.append({
                    "origin": matrix_result['origin_addresses'][0],
                    "destination": f"No se encontró ruta para: {destination_addresses[i]}",
                    "distance_text": "N/A",
                    "duration_text": "N/A",
                    "distance_meters": 0,
                    "duration_seconds": 0
                })
                
        return results_list

    except googlemaps.exceptions.ApiError as e:
        print(f"Error de la API de Google (Matrix): {e}")
        raise e
    except Exception as e:
        print(f"Error inesperado en get_multiple_routes_data: {e}")
        raise e