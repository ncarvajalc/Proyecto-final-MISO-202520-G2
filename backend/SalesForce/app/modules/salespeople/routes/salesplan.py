from typing import List
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from ..schemas.salesplan import SalesPlan, SalesPlanCreate, SalesPlanUpdate
from ..services.salesplan_service import create, read, read_one, update, delete
from pydantic import BaseModel

router = APIRouter(prefix="/planes-ventas", tags=["planes-ventas"])


class CreateSalesPlanRequest(BaseModel):
    """Modelo para la creación de plan de ventas con asignación de vendedores"""
    plan_name: str
    description: str = None
    start_period: str
    end_period: str
    salespeople_ids: List[str]
    goal_values: List[float]


@router.post("/", response_model=SalesPlan)
def create_sales_plan(
    request: CreateSalesPlanRequest,
    db: Session = Depends(get_db)
):
    """
    Crea un plan de ventas y asigna objetivos a los vendedores especificados.
    
    Ejemplo de body:
    ```json
    {
        "plan_name": "Plan Q1 2024",
        "description": "Plan de ventas primer trimestre",
        "start_period": "2024-01-01",
        "end_period": "2024-03-31",
        "salespeople_ids": ["uuid-vendedor-1", "uuid-vendedor-2"],
        "goal_values": [50000.00, 45000.00]
    }
    ```
    """
    # Crear el objeto SalesPlanCreate a partir del request
    salesplan_data = SalesPlanCreate(
        plan_name=request.plan_name,
        description=request.description,
        start_period=request.start_period,
        end_period=request.end_period
    )
    
    return create(db, salesplan_data, request.salespeople_ids, request.goal_values)


@router.get("/")
def read_sales_plans(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    """
    Lista todos los planes de ventas con paginación
    """
    return read(db, page=page, limit=limit)


@router.get("/{salesplan_id}", response_model=SalesPlan)
def read_sales_plan(salesplan_id: str, db: Session = Depends(get_db)):
    """
    Obtiene un plan de ventas específico por ID
    """
    return read_one(db, salesplan_id=salesplan_id)


@router.put("/{salesplan_id}", response_model=SalesPlan)
def update_sales_plan(
    salesplan_id: str, 
    salesplan: SalesPlanUpdate, 
    db: Session = Depends(get_db)
):
    """
    Actualiza un plan de ventas existente
    """
    return update(db, salesplan_id=salesplan_id, salesplan=salesplan)


@router.delete("/{salesplan_id}", response_model=SalesPlan)
def delete_sales_plan(salesplan_id: str, db: Session = Depends(get_db)):
    """
    Elimina un plan de ventas
    Nota: También eliminará los objetivos asociados si hay configuración de cascada
    """
    return delete(db, salesplan_id=salesplan_id)