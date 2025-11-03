import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from ..schemas.dayroutes_schemas import *
from ..services.dayroute_service import (get_dayroute)

logger = logging.getLogger("uvicorn") 

router = APIRouter(prefix="/daily-routes", tags=["routes"])

@router.get("/salesperson", response_model=None)
async def get_salespeople_route(salespeople_id: str, latitude: float, longitude: float, db: Session = Depends(get_db)):
    """Crea un nuevo vendedor"""
    logger.info("Ingreso al servicio %s, y con al id de empleado %s para calcular la ruta desde: latitud %f, y longitud %f", "get_salespeople_route", salespeople_id, latitude, longitude)
    filtros = await get_dayroute(db, salespeople_id, latitude, longitude)
    return filtros