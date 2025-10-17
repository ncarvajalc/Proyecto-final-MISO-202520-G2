import logging
import os
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from starlette.responses import FileResponse
from ....core.database import get_db
from ..services.bulk_service import upload_csv
from sqlalchemy.orm import Session
from ..schemas import bulk_products as schemas

router = APIRouter(prefix="/productos/bulk-upload", tags=["products"])
FILE = "productos.csv"
DOWNLOAD_NAME = "plantilla_productos.csv"
logger = logging.getLogger("uvicorn") 


@router.get("/")
def archivo():
    current_working_directory = Path(os.getcwd())
    absolute_file_path = current_working_directory / FILE

    logger.info("Ruta absoluta del archivo: %s", absolute_file_path)

    if not absolute_file_path.exists():
        return {"error": "Archivo no encontrado"}, 404

    return FileResponse(
        path=absolute_file_path,
        filename=DOWNLOAD_NAME,
        media_type="application/octet-stream",
    )

@router.post("/", response_model=schemas.UploadSummaryResponse)
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    return await upload_csv(db, file)
