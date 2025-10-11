import logging
import os
from pathlib import Path

from fastapi import APIRouter
from starlette.responses import FileResponse


router = APIRouter(prefix="/api/product/csv", tags=["products"])
FILE = "productos.csv"
DOWNLOAD_NAME = "productos.csv"
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
