
import csv
import io
from sqlalchemy.orm import Session
from ..models.bulk_products import UploadFileProduct, UploadLogProduct, Product, TechnicalSheet, Specification
from decimal import Decimal

def create_upload_file_record(db: Session, file_name: str, file_path: str, status: str) -> UploadFileProduct:
    db_upload_file = UploadFileProduct(
        file_name=file_name,
        file_path=file_path,
        upload_status=status
    )
    db.add(db_upload_file)
    db.commit()
    db.refresh(db_upload_file)
    return db_upload_file

def update_upload_file_status(db: Session, file_id: str, status: str):
    db_upload_file = db.query(UploadFileProduct).filter(UploadFileProduct.id == file_id).first()
    if db_upload_file:
        db_upload_file.upload_status = status
        db.commit()

def create_log_entry(db: Session, file_id: str, row_number: int, status: str, error_message: str = None, product_id: str = None):
    db_log = UploadLogProduct(
        file_id=file_id,
        product_id=product_id,
        row_number=row_number,
        row_status=status,
        error_message=error_message
    )
    db.add(db_log)

def process_csv_file(db: Session, file_id: str, csv_content: bytes):
    total_rows = 0
    successful_rows = 0
    failed_rows = 0
    
    try:
        # Decode bytes to string and read with csv.reader
        content_str = csv_content.decode('utf-8')
        reader = csv.reader(io.StringIO(content_str))
        
        header = next(reader) # Skip header row
        total_rows = 0

        for i, row in enumerate(reader, start=1):
            total_rows += 1
            row_number = i
            product_data = dict(zip(header, row))

            try:
                # Check for existing SKU
                sku = product_data.get("sku")
                if not sku:
                    raise ValueError("SKU is a required field.")
                
                existing_product = db.query(Product).filter(Product.sku == sku).first()
                if existing_product:
                    raise ValueError(f"Product with SKU '{sku}' already exists.")

                # Create Product
                new_product = Product(
                    product_name=product_data.get("nombre"),
                    description=product_data.get("descripcion"),
                    sku=sku,
                    price=Decimal(product_data.get("precio", 0)),
                    is_active=product_data.get("is_active", 'true').lower() == 'true'
                )
                db.add(new_product)
                db.flush() # Use flush to get the ID before committing

                # Create Technical Sheet
                new_sheet = TechnicalSheet(
                    product_id=new_product.id,
                    user_manual_url=product_data.get("urlManual"),
                    installation_guide_url=product_data.get("urlHojaInstalacion"),
                    certifications=product_data.get("certificaciones")
                )
                db.add(new_sheet)

                # Create Specifications (assuming they are in the format spec_name:spec_value)
                for key, value in product_data.items():
                    if key.startswith("spec_") and value:
                        spec_name = key.replace("spec_", "").replace("_", " ")
                        new_spec = Specification(
                            product_id=new_product.id,
                            name=spec_name,
                            value=value
                        )
                        db.add(new_spec)

                create_log_entry(db, file_id, row_number, "SUCCESS", product_id=new_product.id)
                successful_rows += 1
                db.commit()

            except Exception as e:
                db.rollback()
                create_log_entry(db, file_id, row_number, "FAILED", error_message=str(e))
                failed_rows += 1
                db.commit()

        # Final status update
        final_status = "COMPLETED"
        if failed_rows > 0 and successful_rows == 0:
            final_status = "FAILED"
        elif failed_rows > 0:
            final_status = "COMPLETED_WITH_ERRORS"
        
        update_upload_file_status(db, file_id, final_status)

    except Exception as e:
        db.rollback()
        update_upload_file_status(db, file_id, "ERROR_PROCESSING_FILE")
        # Log a general file processing error if needed
    
    return total_rows, successful_rows, failed_rows
