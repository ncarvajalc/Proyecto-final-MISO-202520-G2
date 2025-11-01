from app.core.database import Base, engine
import logging

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

def init_db():
    """
    Inicializa la base de datos.
    Importa todos los modelos necesarios para que
    Base.metadata los conozca y cree las tablas.
    """
    
    log.info("Importando modelos para la creación de tablas...")
    
    # --- ¡IMPORTANTE! ---
    # Importa aquí TODOS los modelos que SQLAlchemy debe crear.
    # Al importarlos, se registran en Base.metadata.
    try:
        # Importamos los modelos que tu seed_db.py utiliza
        from app.modules.territories.models.territories_model import Territorio
        from app.modules.institutional_clients.models import InstitutionalClient
        
        # Si tuvieras más modelos (ej. Productos), los importarías aquí también
        # from app.modules.products.models.bulk_products import Product

        log.info("Modelos importados correctamente.")
        
    except ImportError as e:
        log.error(f"No se pudieron importar los modelos: {e}")
        log.error("Asegúrate de que los paths de importación son correctos y que los archivos existen.")
        log.error("No se crearán tablas.")
        return

    log.info("Creando todas las tablas en la base de datos (si no existen)...")
    # Create all tables
    Base.metadata.create_all(bind=engine)
    log.info("Tablas creadas exitosamente (o ya existían).")


if __name__ == "__main__":
    log.info("Ejecutando script de inicialización de BD directamente...")
    init_db()
