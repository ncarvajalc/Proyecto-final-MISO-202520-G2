"""
Database seeding script
Populates the database with initial medical products
"""

import json
from app.core.database import SessionLocal
from app.modules.products.models.bulk_products import Product


def seed_products():
    """Create initial medical products"""
    db = SessionLocal()
    try:
        products_data = [
            {
                "sku": "MED-12345",
                "nombre": "Termómetro Digital",
                "descripcion": "Termómetro digital de alta precisión para uso médico",
                "precio": 45000,
                "activo": True,
                "especificaciones_json": json.dumps([
                    {"nombre": "Precisión", "valor": "±0.1°C"},
                    {"nombre": "Rango", "valor": "32-42°C"},
                    {"nombre": "Tiempo de medición", "valor": "10 segundos"}
                ]),
                "hoja_tecnica_manual": "https://example.com/manual-termometro.pdf",
                "hoja_tecnica_certificaciones": json.dumps(["FDA", "CE", "INVIMA"])
            },
            {
                "sku": "MED-12346",
                "nombre": "Tensiómetro Digital",
                "descripcion": "Tensiómetro automático de brazo con memoria",
                "precio": 120000,
                "activo": True,
                "especificaciones_json": json.dumps([
                    {"nombre": "Memoria", "valor": "90 mediciones"},
                    {"nombre": "Rango de presión", "valor": "0-299 mmHg"},
                    {"nombre": "Detección de arritmia", "valor": "Sí"}
                ]),
                "hoja_tecnica_manual": "https://example.com/manual-tensiometro.pdf",
                "hoja_tecnica_certificaciones": json.dumps(["FDA", "CE", "INVIMA"])
            },
            {
                "sku": "MED-12347",
                "nombre": "Oxímetro de Pulso",
                "descripcion": "Oxímetro digital portátil para medir saturación de oxígeno",
                "precio": 85000,
                "activo": True,
                "especificaciones_json": json.dumps([
                    {"nombre": "Rango SpO2", "valor": "70-100%"},
                    {"nombre": "Precisión", "valor": "±2%"},
                    {"nombre": "Pantalla", "valor": "LED"}
                ]),
                "hoja_tecnica_manual": "https://example.com/manual-oximetro.pdf",
                "hoja_tecnica_certificaciones": json.dumps(["FDA", "CE"])
            },
            {
                "sku": "MED-12348",
                "nombre": "Glucómetro",
                "descripcion": "Medidor de glucosa en sangre con tiras reactivas",
                "precio": 95000,
                "activo": True,
                "especificaciones_json": json.dumps([
                    {"nombre": "Tiempo de medición", "valor": "5 segundos"},
                    {"nombre": "Memoria", "valor": "500 registros"},
                    {"nombre": "Muestra de sangre", "valor": "0.6 μL"}
                ]),
                "hoja_tecnica_manual": "https://example.com/manual-glucometro.pdf",
                "hoja_tecnica_certificaciones": json.dumps(["FDA", "CE", "INVIMA"])
            },
            {
                "sku": "MED-12349",
                "nombre": "Nebulizador Ultrasónico",
                "descripcion": "Nebulizador portátil para tratamiento respiratorio",
                "precio": 180000,
                "activo": True,
                "especificaciones_json": json.dumps([
                    {"nombre": "Capacidad", "valor": "10 ml"},
                    {"nombre": "Tamaño de partícula", "valor": "1-5 μm"},
                    {"nombre": "Tiempo de nebulización", "valor": "8-15 minutos"}
                ]),
                "hoja_tecnica_manual": "https://example.com/manual-nebulizador.pdf",
                "hoja_tecnica_certificaciones": json.dumps(["CE", "INVIMA"])
            },
            {
                "sku": "MED-12350",
                "nombre": "Estetoscopio Profesional",
                "descripcion": "Estetoscopio de doble campana para uso profesional",
                "precio": 150000,
                "activo": True,
                "especificaciones_json": json.dumps([
                    {"nombre": "Material", "valor": "Acero inoxidable"},
                    {"nombre": "Tipo", "valor": "Doble campana"},
                    {"nombre": "Longitud de tubo", "valor": "69 cm"}
                ]),
                "hoja_tecnica_manual": "https://example.com/manual-estetoscopio.pdf",
                "hoja_tecnica_certificaciones": json.dumps(["CE"])
            },
            {
                "sku": "MED-12351",
                "nombre": "Mascarilla N95",
                "descripcion": "Mascarilla de protección respiratoria N95 (caja x 20)",
                "precio": 75000,
                "activo": True,
                "especificaciones_json": json.dumps([
                    {"nombre": "Eficiencia de filtración", "valor": "≥95%"},
                    {"nombre": "Tipo", "valor": "Desechable"},
                    {"nombre": "Unidades por caja", "valor": "20"}
                ]),
                "hoja_tecnica_manual": "https://example.com/manual-mascarilla.pdf",
                "hoja_tecnica_certificaciones": json.dumps(["NIOSH", "FDA", "INVIMA"])
            },
            {
                "sku": "MED-12352",
                "nombre": "Guantes de Nitrilo",
                "descripcion": "Guantes de nitrilo sin polvo (caja x 100)",
                "precio": 35000,
                "activo": True,
                "especificaciones_json": json.dumps([
                    {"nombre": "Material", "valor": "Nitrilo"},
                    {"nombre": "Sin polvo", "valor": "Sí"},
                    {"nombre": "Unidades por caja", "valor": "100"}
                ]),
                "hoja_tecnica_manual": "https://example.com/manual-guantes.pdf",
                "hoja_tecnica_certificaciones": json.dumps(["FDA", "CE", "INVIMA"])
            },
            {
                "sku": "MED-12353",
                "nombre": "Jeringa 10ml",
                "descripcion": "Jeringa desechable de 10ml con aguja (caja x 100)",
                "precio": 45000,
                "activo": True,
                "especificaciones_json": json.dumps([
                    {"nombre": "Capacidad", "valor": "10 ml"},
                    {"nombre": "Tipo de aguja", "valor": "21G"},
                    {"nombre": "Unidades por caja", "valor": "100"}
                ]),
                "hoja_tecnica_manual": "https://example.com/manual-jeringa.pdf",
                "hoja_tecnica_certificaciones": json.dumps(["FDA", "CE", "INVIMA"])
            },
            {
                "sku": "MED-12354",
                "nombre": "Alcohol Antiséptico 70%",
                "descripcion": "Alcohol antiséptico para uso médico (1 litro)",
                "precio": 12000,
                "activo": True,
                "especificaciones_json": json.dumps([
                    {"nombre": "Concentración", "valor": "70%"},
                    {"nombre": "Volumen", "valor": "1000 ml"},
                    {"nombre": "Uso", "valor": "Desinfección de superficies y piel"}
                ]),
                "hoja_tecnica_manual": "https://example.com/manual-alcohol.pdf",
                "hoja_tecnica_certificaciones": json.dumps(["INVIMA"])
            }
        ]

        created_products = []
        for product_data in products_data:
            # Check if product already exists
            existing = (
                db.query(Product)
                .filter(Product.sku == product_data["sku"])
                .first()
            )

            if not existing:
                product = Product(**product_data)
                db.add(product)
                created_products.append(product_data["sku"])

        db.commit()
        if created_products:
            print(
                f"Created {len(created_products)} products: {', '.join(created_products)}"
            )
        else:
            print("Products already exist")
    except Exception as e:
        db.rollback()
        print(f"Error seeding products: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def seed_all():
    """Run all seeding functions in the correct order"""
    print("\n🌱 Starting products database seeding...\n")

    seed_products()

    print("\nProducts database seeding completed!\n")


if __name__ == "__main__":
    seed_all()
