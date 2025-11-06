from typing import List, Optional
from fastapi import APIRouter, Depends, File, UploadFile, Form
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.core.database import get_db
from app.modules.visits.schemas import Visit, VisitCreate, VisitsResponse
from app.modules.visits.services import create as create_visit, list_visits

router = APIRouter(prefix="/visitas", tags=["visitas"])


@router.post("/", response_model=Visit)
async def create_visit_endpoint(
    nombre_institucion: str = Form(...),
    direccion: str = Form(...),
    hora: str = Form(...),  # ISO format datetime string
    estado: str = Form(...),
    desplazamiento_minutos: Optional[int] = Form(None),
    hora_salida: Optional[str] = Form(None),  # ISO format datetime string
    observacion: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    """
    Create a new visit with optional multimedia files.

    - **nombre_institucion**: Institution name
    - **direccion**: Address
    - **hora**: Visit datetime (ISO format)
    - **estado**: Visit status
    - **desplazamiento_minutos**: Travel time in minutes (optional)
    - **hora_salida**: Departure time (ISO format, optional)
    - **observacion**: Observations (optional)
    - **files**: Multiple files to upload (optional)
    """
    # Parse datetime strings
    hora_dt = datetime.fromisoformat(hora.replace('Z', '+00:00'))
    hora_salida_dt = datetime.fromisoformat(hora_salida.replace('Z', '+00:00')) if hora_salida else None

    # Create VisitCreate schema
    visit_data = VisitCreate(
        nombre_institucion=nombre_institucion,
        direccion=direccion,
        hora=hora_dt,
        desplazamiento_minutos=desplazamiento_minutos,
        hora_salida=hora_salida_dt,
        estado=estado,
        observacion=observacion
    )

    # Process files if provided
    multimedia_data = []
    if files:
        for file in files:
            content = await file.read()
            multimedia_data.append({
                "file_name": file.filename,
                "file_type": file.content_type,
                "file_size": len(content),
                "file_data": content
            })

    return create_visit(db, visit_data, multimedia_data)


@router.get("/", response_model=VisitsResponse)
def list_visits_endpoint(
    page: int = 1, limit: int = 10, db: Session = Depends(get_db)
):
    return list_visits(db, page=page, limit=limit)
