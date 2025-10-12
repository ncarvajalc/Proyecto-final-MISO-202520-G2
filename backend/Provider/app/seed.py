from app.database import SessionLocal, engine, Base
from app.models.proveedor import Proveedor

Base.metadata.create_all(bind=engine)
db = SessionLocal()

proveedores_demo = [
    Proveedor(nombre="Proveedor A", id_tax="12345", direccion="Calle 1", telefono="111111", correo="a@proveedor.com", contacto="Juan", estado="Activo"),
    Proveedor(nombre="Proveedor B", id_tax="67890", direccion="Calle 2", telefono="222222", correo="b@proveedor.com", contacto="Ana", estado="Inactivo"),
]

db.add_all(proveedores_demo)
db.commit()
db.close()

print("✅ Datos de ejemplo cargados en SQLite.")
