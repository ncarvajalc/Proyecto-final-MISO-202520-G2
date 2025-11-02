"""
Script de siembra (seeding) de la base de datos.

Este script se ejecuta desde 'entrypoint.sh'.
Puebla la base de datos con:
1. Territorios (Países, Estados, Ciudades)
2. Clientes Institucionales (Hospitales, vinculados a las ciudades)
"""

import json
import uuid
import logging
import enum
from app.core.database import SessionLocal
from sqlalchemy.orm import Session
from datetime import date

# Importaciones de modelos (como las tienes en tu script)
try:
    # Importar el modelo y el Enum
    from app.modules.territories.models.territories_model import Territorio, TerritoryType
except ImportError:
    logging.warning("No se pudo importar 'TerritoryType'. Se usará un Enum dummy.")
    logging.warning("Asegúrate de que 'TerritoryType' (Enum) esté definido en 'territories_model.py'")
    
    # Importar solo Territorio
    from app.modules.territories.models.territories_model import Territorio
    
    # Crear un Enum dummy para que el script se ejecute
    class TerritoryType(str, enum.Enum):
        COUNTRY = "COUNTRY"
        STATE = "STATE"
        CITY = "CITY"

from app.modules.institutional_clients.models import InstitutionalClient
from app.modules.salespeople.models.salespeople_model import Salespeople, Route

    
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# --- Datos de Territorios ---
TERRITORIOS_DATA = {
    "Colombia": {
        "id": str(uuid.uuid4()),
        "states": {
            "Cundinamarca": {
                "id": str(uuid.uuid4()),
                "cities": ["Bogotá", "Girardot", "Zipaquirá"]
            },
            "Antioquia": {
                "id": str(uuid.uuid4()),
                "cities": ["Medellín", "Envigado", "Rionegro"]
            },
        }
    },
    "Perú": {
        "id": str(uuid.uuid4()),
        "states": {
            "Lima": {
                "id": str(uuid.uuid4()),
                "cities": ["Lima", "Callao", "Miraflores"]
            },
            "Arequipa": {
                "id": str(uuid.uuid4()),
                "cities": ["Arequipa", "Yanahuara"]
            },
        }
    },
    "Ecuador": {
        "id": str(uuid.uuid4()),
        "states": {
            "Pichincha": {
                "id": str(uuid.uuid4()),
                "cities": ["Quito", "Sangolquí"]
            },
            "Guayas": {
                "id": str(uuid.uuid4()),
                "cities": ["Guayaquil", "Durán"]
            },
        }
    },
    "México": {
        "id": str(uuid.uuid4()),
        "states": {
            "Ciudad de México": {
                "id": str(uuid.uuid4()),
                "cities": ["Ciudad de México"] # CDMX es estado y ciudad
            },
            "Jalisco": {
                "id": str(uuid.uuid4()),
                "cities": ["Guadalajara", "Zapopan", "Puerto Vallarta"]
            },
            "Nuevo León": {
                "id": str(uuid.uuid4()),
                "cities": ["Monterrey", "San Pedro Garza García"]
            },
        }
    }
}

# --- Datos de Hospitales ---
HOSPITALES_DATA = [
    # Colombia
    {"nombre": "Fundación Santa Fe de Bogotá", "nit": "860.010.518-1", "ciudad": "Bogotá", "direccion": "Carrera 7 # 117-15"},
    {"nombre": "Hospital Pablo Tobón Uribe", "nit": "890.900.380-1", "ciudad": "Medellín", "direccion": "Calle 78B # 69-240"},
    {"nombre": "Hospital San Ignacio", "nit": "860.010.518-2", "ciudad": "Bogotá", "direccion": "Carrera 7 # 40-62"},
    {"nombre": "Clínica de Las Américas", "nit": "890.900.380-2", "ciudad": "Medellín", "direccion": "Diagonal 75B # 2A-80"},
    # Perú
    {"nombre": "Clínica Anglo Americana", "nit": "20100063223", "ciudad": "Lima", "direccion": "Av. Alfredo Salazar 350, San Isidro"},
    {"nombre": "Clínica Ricardo Palma", "nit": "20131234567", "ciudad": "Lima", "direccion": "Av. Javier Prado Este 1066, San Isidro"},
    {"nombre": "Hospital Nacional Edgardo Rebagliati", "nit": "20131234568", "ciudad": "Lima", "direccion": "Av. Edgardo Rebagliati 490, Jesús María"},
    # Ecuador
    {"nombre": "Hospital Metropolitano", "nit": "1790000123001", "ciudad": "Quito", "direccion": "Av. Mariana de Jesús s/n"},
    {"nombre": "Clínica Kennedy", "nit": "0990000456001", "ciudad": "Guayaquil", "direccion": "Av. Rodolfo Baquerizo Nazur y C. Crotos (Alborada)"},
    # México
    {"nombre": "Hospital ABC", "nit": "HAB870101-AAA", "ciudad": "Ciudad de México", "direccion": "Sur 136 # 116, Col. Las Américas (Campus Observatorio)"},
    {"nombre": "Hospital Ángeles Lomas", "nit": "HAL950101-BBB", "ciudad": "Ciudad de México", "direccion": "Vialidad de la Barranca 240, Huixquilucan"},
    {"nombre": "Hospital Zambrano Hellion", "nit": "HZH000101-CCC", "ciudad": "Monterrey", "direccion": "Av. Batallón de San Patricio 112, San Pedro Garza García"},
    {"nombre": "Hospital San Javier", "nit": "HSJ-GDL-987", "ciudad": "Guadalajara", "direccion": "Av. Pablo Casals 640, Prados de Providencia"},
]


def seed_territorios(db: Session) -> dict:
    """Crea los países, estados y ciudades. Devuelve un mapa de ciudades."""
    log.info("Sembrando territorios...")
    
    city_map = {} # Guardará {'Bogotá': 'uuid-de-bogota', ...}
    
    try:
        # 1. Verificar si ya existen datos para no duplicar
        count = db.query(Territorio).count()
        if count > 0:
            log.warning("Territorios ya existen, saltando siembra de territorios.")
            # Si ya existen, poblamos el city_map desde la BD
            
            # Filtramos por tipo CIUDAD (asumiendo que el enum está disponible)
            ciudades_db = db.query(Territorio).filter(Territorio.type == TerritoryType.CITY).all()
            
            for c in ciudades_db:
                 # Usamos 'name' en lugar de 'nombre'
                 city_map[c.name] = str(c.id)
                 
            if not city_map:
                log.error("¡Territorios existen pero no se pudo construir city_map!")
            return city_map

        # 2. Si no existen, los creamos
        for pais_nombre, pais_data in TERRITORIOS_DATA.items():
            # Crear País
            pais_id_str = pais_data["id"]
            db.add(Territorio(
                id=uuid.UUID(pais_id_str), 
                name=pais_nombre,                 # CAMBIO: nombre -> name
                id_parent=None,                   # CAMBIO: parent_id -> id_parent
                type=TerritoryType.COUNTRY      # NUEVO: type
            ))
            
            for estado_nombre, estado_data in pais_data["states"].items():
                # Crear Estado
                estado_id_str = estado_data["id"]
                db.add(Territorio(
                    id=uuid.UUID(estado_id_str), 
                    name=estado_nombre,           # CAMBIO: nombre -> name
                    id_parent=uuid.UUID(pais_id_str), # CAMBIO: parent_id -> id_parent
                    type=TerritoryType.STATE      # NUEVO: type
                ))
                
                for ciudad_nombre in estado_data["cities"]:
                    # Crear Ciudad
                    ciudad_id = uuid.uuid4()
                    db.add(Territorio(
                        id=ciudad_id, 
                        name=ciudad_nombre,         # CAMBIO: nombre -> name
                        id_parent=uuid.UUID(estado_id_str), # CAMBIO: parent_id -> id_parent
                        type=TerritoryType.CITY     # NUEVO: type
                    ))
                    
                    # Guardar en el mapa
                    if ciudad_nombre in city_map:
                        log.warning(f"Nombre de ciudad duplicado: {ciudad_nombre}. Usando el último ID.")
                    city_map[ciudad_nombre] = str(ciudad_id) # Guardamos como string

        db.commit()
        log.info(f"Creados {len(city_map)} ciudades y sus jerarquías.")
        
    except Exception as e:
        db.rollback()
        log.error(f"Error sembrando territorios: {e}")
        import traceback
        traceback.print_exc()
        return {} # Devolver mapa vacío en caso de error
        
    return city_map


def seed_institutional_clients(db: Session, city_map: dict) -> dict:
    """Crea clientes institucionales (hospitales) y devuelve mapa {nit: id}."""
    log.info("Sembrando clientes institucionales...")
    
    institution_map = {}

    if not city_map:
        log.error("No se proporcionó mapa de ciudades (city_map). No se pueden sembrar clientes.")
        return institution_map 

    try:
        created_nits = []
        
        for hosp in HOSPITALES_DATA:
            nit = hosp["nit"]
            
            # 1. Verificar si ya existe
            existing = db.query(InstitutionalClient).filter(InstitutionalClient.identificacion_tributaria == nit).first()
            if existing:
                institution_map[nit] = str(existing.id)
                continue

            # ... (Lógica existente para buscar territory_id_uuid) ...
            ciudad_nombre = hosp["ciudad"]
            territory_id_str = city_map.get(ciudad_nombre)
            territory_id_uuid = uuid.UUID(territory_id_str) if territory_id_str else None
            if not territory_id_uuid:
                 log.warning(f"No se encontró ID para la ciudad: {ciudad_nombre}...")

            client = InstitutionalClient(
                id=str(uuid.uuid4()), 
                nombre_institucion=hosp["nombre"],
                identificacion_tributaria=nit,
                territory_id=str(territory_id_uuid) if territory_id_uuid else None,
                direccion=f"{hosp['direccion']}",
                direccion_institucional=f"contacto@{nit}.com",
                representante_legal="Dr. Apellido",
                telefono="123456789",
            )
            db.add(client)
            created_nits.append(nit) # <-- MODIFICADO
        
        db.commit()
        
        if created_nits:
            log.info(f"Creados {len(created_nits)} clientes institucionales.")
            # 6. Actualizar el mapa con los IDs de los recién creados
            new_clients = db.query(InstitutionalClient).filter(
                InstitutionalClient.identificacion_tributaria.in_(created_nits)
            ).all()
            for client in new_clients:
                institution_map[client.identificacion_tributaria] = str(client.id)
        else:
            log.info("Clientes institucionales ya existen.")
        return institution_map
    except Exception as e:
        db.rollback()
        log.error(f"Error sembrando clientes institucionales: {e}")
        import traceback
        traceback.print_exc()
        return {}


# --- Datos de Vendedores (Salespeople) --- (NUEVO)
SALESPEOPLE_DATA = [
    {"full_name": "Ana García", "email": "ana.garcia@company.com", "hire_date": "2023-01-15", "status": "Active", "territory_name": "Bogotá"}, # Ciudad 
    {"full_name": "Luis Pérez", "email": "luis.perez@company.com", "hire_date": "2022-11-10", "status": "Active", "territory_name": "Medellín"}, # Ciudad
    {"full_name": "Carla Ruiz", "email": "carla.ruiz@company.com", "hire_date": "2023-05-20", "status": "Active", "territory_name": "Lima"}, # Ciudad 
    {"full_name": "Miguel Soto (Ecuador)", "email": "miguel.soto@company.com", "hire_date": "2023-02-01", "status": "Active", "territory_name": "Quito"}, # Ciudad 
    {"full_name": "Javier Torres", "email": "javier.torres@company.com", "hire_date": "2022-09-05", "status": "Active", "territory_name": "Guadalajara"}, # Ciudad (Antes Jalisco)
    {"full_name": "Maria Rodriguez (Bogotá)", "email": "maria.r@company.com", "hire_date": "2022-01-01", "status": "Active", "territory_name": "Bogotá"}, # Ciudad 
]

def seed_salespeople(db: Session, city_map: dict) -> dict:
    """Crea Vendedores (salespeople) y devuelve un mapa de email -> id."""
    log.info("Sembrando salespeople (vendedores)...")

    salespeople_map = {} # Este mapa SÍ se llenará

    if not hasattr(Salespeople, '__tablename__'):
        log.error("Clase 'Salespeople' no válida. Saltando...")
        return salespeople_map

    # 1. Construir mapa de territorios (Esto está bien)
    territory_id_map = {}
    for pais_nombre, pais_data in TERRITORIOS_DATA.items():
        territory_id_map[pais_nombre] = pais_data["id"]
        for estado_nombre, estado_data in pais_data["states"].items():
            territory_id_map[estado_nombre] = estado_data["id"]
    territory_id_map.update(city_map)

    try:
        created_count = 0
        
        # --- LÓGICA CORREGIDA ---
        # No podemos leer los emails encriptados de la BD.
        # Debemos iterar sobre nuestros datos y PREGUNTAR a la BD si existen.
        
        for data in SALESPEOPLE_DATA:
            email = data["email"]
            
            # 1. PREGUNTAR a la BD si este email (de texto simple) ya existe.
            # SQLAlchemy sabe cómo manejar la encriptación en el WHERE.
            existing = db.query(Salespeople).filter(Salespeople.email == email).first()
            
            if existing:
                # Si ya existe, solo lo añadimos al mapa y continuamos
                salespeople_map[email] = str(existing.id)
                continue
                
            # 2. Si no existe, lo CREAMOS
            territory_name = data["territory_name"]
            territory_id = territory_id_map.get(territory_name)
            
            if not territory_id:
                log.warning(f"No se encontró ID para territorio: {territory_name}. Vendedor '{data['full_name']}' se creará sin territory_id.")
                
            hire_date_obj = date.fromisoformat(data["hire_date"])
            
            salesperson = Salespeople(
                full_name=data["full_name"],
                email=email,
                hire_date=hire_date_obj,
                status=data["status"],
                territory_id=territory_id,
                user_id=None
            )
            db.add(salesperson)
            created_count += 1
            
        db.commit() # Commit de todos los nuevos vendedores
        
        if created_count > 0:
            log.info(f"Creados {created_count} salespeople.")
            
            # 3. ACTUALIZAR el mapa con los IDs de los recién creados
            # (Re-consultamos para obtener los IDs generados por la BD)
            for data in SALESPEOPLE_DATA:
                email = data["email"]
                if email not in salespeople_map: # Si no lo encontramos antes
                    new_sp = db.query(Salespeople).filter(Salespeople.email == email).first()
                    if new_sp:
                        salespeople_map[email] = str(new_sp.id)
        else:
            log.info("Salespeople ya existen.")
            
        return salespeople_map # <-- Devuelve el mapa poblado
        
    except Exception as e:
        db.rollback()
        log.error(f"Error sembrando salespeople: {e}")
        import traceback
        traceback.print_exc()
        return {}

ROUTES_DATA = [
    # Rutas para Ana García (Bogotá)
    {"salesperson_email": "ana.garcia@company.com", "institution_nit": "860.010.518-1", "day": "2025-10-27", "done": 0}, # Visita a Santa Fe
    {"salesperson_email": "ana.garcia@company.com", "institution_nit": "860.010.518-2", "day": "2025-10-28", "done": 0}, # Visita a San Ignacio
    
    # Rutas para Luis Pérez (Medellín)
    {"salesperson_email": "luis.perez@company.com", "institution_nit": "890.900.380-1", "day": "2025-10-27", "done": 0}, # Visita a Pablo Tobón
    
    # Rutas para Carla Ruiz (Lima)
    {"salesperson_email": "carla.ruiz@company.com", "institution_nit": "20100063223", "day": "2025-10-29", "done": 0}, # Visita a Clínica Anglo Americana

    # Rutas para Javier Torres (Guadalajara)
    {"salesperson_email": "javier.torres@company.com", "institution_nit": "HSJ-GDL-987", "day": "2025-10-27", "done": 0}, # Visita a Hospital San Javier
]

def seed_routes(db: Session, salespeople_map: dict, institution_map: dict):
    """Crea las Rutas (routes) diarias para los vendedores."""
    log.info("Sembrando routes (rutas)...")
    
    if not salespeople_map:
        log.error("No se proporcionó mapa de salespeople. No se pueden sembrar rutas.")
        return
        
    if not institution_map:
        log.error("No se proporcionó mapa de instituciones. No se pueden sembrar rutas.")
        return

    if not hasattr(Route, '__tablename__'):
        log.error("Clase 'Route' no válida. Saltando siembra de rutas.")
        return

    try:
        created_count = 0
        for route_data in ROUTES_DATA:
            email_vendedor = route_data["salesperson_email"]
            nit_institucion = route_data["institution_nit"]
            
            salesperson_id = salespeople_map.get(email_vendedor)
            institution_id = institution_map.get(nit_institucion)
            
            if not salesperson_id or not institution_id:
                log.warning(f"No se encontró ID para vendedor ({email_vendedor}) o institución ({nit_institucion}). Saltando ruta.")
                continue
                
            day_obj = date.fromisoformat(route_data["day"])
            
            # Verificar si la ruta (vendedor + institucion + dia) ya existe
            existing = db.query(Route).filter(
                Route.salespeople_id == salesperson_id,
                Route.institution_id == institution_id, 
                Route.day == day_obj
            ).first()
            
            if existing:
                continue
                
            # Crear la ruta
            route = Route(
                salespeople_id=salesperson_id,
                institution_id=institution_id,
                day=day_obj,
                done=route_data["done"]
            )
            db.add(route)
            created_count += 1
        
        db.commit() 
            
        if created_count > 0:
            log.info(f"Creadas {created_count} rutas.")
        else:
            log.info("Rutas ya existen.")

    except Exception as e:
        db.rollback()
        log.error(f"Error sembrando routes: {e}")
        import traceback
        traceback.print_exc()

def seed_all():
    """Ejecuta todas las funciones de siembra en el orden correcto"""
    
    db = SessionLocal()
    
    try:
        log.info("Iniciando siembra de base de datos...\n")
        
        # 1. Crear territorios y obtener el mapa de ciudades
        city_id_map = seed_territorios(db)
        
        # 2. Crear clientes
        institution_id_map = seed_institutional_clients(db, city_id_map)
        
        # 3. Crear Vendedores
        salespeople_id_map = seed_salespeople(db, city_id_map)
        
        # 4. Crear Rutas
        seed_routes(db, salespeople_id_map, institution_id_map)
        
        log.info("Siembra de base de datos completada!\n")
        
    except Exception as e:
        log.error(f"Error durante la siembra total: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    log.info("Ejecutando script de siembra directamente...")
    seed_all()

