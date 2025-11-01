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


def seed_institutional_clients(db: Session, city_map: dict):
    """Crea clientes institucionales (hospitales) usando los IDs de las ciudades."""
    log.info("Sembrando clientes institucionales...")
    
    if not city_map:
        log.error("No se proporcionó mapa de ciudades (city_map). No se pueden sembrar clientes.")
        return

    try:
        created_clients = []
        for hosp in HOSPITALES_DATA:
            nit = hosp["nit"]
            
            # Verificar si ya existe
            existing = db.query(InstitutionalClient).filter(InstitutionalClient.identificacion_tributaria == nit).first()
            if existing:
                continue

            # Buscar el territory_id de la ciudad
            ciudad_nombre = hosp["ciudad"]
            territory_id_str = city_map.get(ciudad_nombre)
            
            territory_id_uuid = None
            if territory_id_str:
                territory_id_uuid = uuid.UUID(territory_id_str) # Convertir a UUID
            else:
                log.warning(f"No se encontró ID para la ciudad: {ciudad_nombre}. El cliente '{hosp['nombre']}' se creará sin territory_id.")
                
            client = InstitutionalClient(
                id=str(uuid.uuid4()), # El modelo de InstitutionalClient espera str
                nombre_institucion=hosp["nombre"],
                identificacion_tributaria=nit,
                territory_id=str(territory_id_uuid) if territory_id_uuid else None, # Guardamos como string
                # Datos de relleno
                direccion=f"{hosp['direccion']}",
                direccion_institucional=f"contacto@{nit}.com",
                representante_legal="Dr. Apellido",
                telefono="123456789",
            )
            db.add(client)
            created_clients.append(nit)
        
        db.commit()
        if created_clients:
            log.info(f"Creados {len(created_clients)} clientes institucionales.")
        else:
            log.info("Clientes institucionales ya existen.")

    except Exception as e:
        db.rollback()
        log.error(f"Error sembrando clientes institucionales: {e}")
        import traceback
        traceback.print_exc()


def seed_all():
    """Ejecuta todas las funciones de siembra en el orden correcto"""
    
    db = SessionLocal()
    
    try:
        log.info("\n🌱 Iniciando siembra de base de datos...\n")
        
        # 1. Crear territorios y obtener el mapa de ciudades
        city_id_map = seed_territorios(db)
        
        # 2. Crear clientes usando el mapa de ciudades
        seed_institutional_clients(db, city_id_map)
        
        log.info("\n✅ Siembra de base de datos completada!\n")
        
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

