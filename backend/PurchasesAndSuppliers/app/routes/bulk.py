from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from starlette.responses import FileResponse
from pathlib import Path
import logging
import os


router = APIRouter(prefix="/api/product/csv", tags=["products"])
FILE = "productos.csv"
DOWNLOAD_NAME = "productos.csv"
logger = logging.getLogger("uvicorn") 


@router.get("/")
def archivo():
    current_working_directory = Path(os.getcwd())
    absolute_file_path = current_working_directory / FILE

    logger.info(f"Ruta absoluta del archivo: {absolute_file_path}")


    if not absolute_file_path.exists():
        return {"error": "Archivo no encontrado"}, 404

    return FileResponse(
        path=absolute_file_path,
        filename=DOWNLOAD_NAME,
        media_type='application/octet-stream'
    )

'''@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # default role 'user'
    user = create_user_service(db, user_in)
    return user'''