import os
import uuid
from fastapi import  HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..models import bulk_products as models
from ..schemas import bulk_products as schemas
from ..crud import crud
import uuid

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def upload_csv(db: Session, file: UploadFile):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Only CSV files are allowed.")

    # Save the uploaded file
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception:
        raise HTTPException(status_code=500, detail="Could not save file.")
    finally:
        await file.close()

    # Create initial record for the upload
    upload_record = crud.create_upload_file_record(
        db=db, 
        file_name=file.filename, 
        file_path=file_path, 
        status="PENDING"
    )

    # Process the CSV in the background (in a real app, use Celery or FastAPI's BackgroundTasks)
    # For this example, we run it synchronously for simplicity.
    total_rows, successful_rows, failed_rows = crud.process_csv_file(
        db=db, 
        file_id=upload_record.id, 
        csv_content=contents
    )

    # Fetch the final status and error logs
    db.refresh(upload_record)
    error_logs = db.query(models.UploadLogProduct).filter(
        models.UploadLogProduct.file_id == upload_record.id,
        models.UploadLogProduct.row_status == "FAILED"
    ).all()

    return schemas.UploadSummaryResponse(
        file_id=upload_record.id,
        status=upload_record.upload_status,
        total_rows=total_rows,
        successful_rows=successful_rows,
        failed_rows=failed_rows,
        errors=error_logs
    )
