from sqlalchemy.orm import Session, joinedload
from ..models.salespeople_model import SalesPlan, SalespeopleGoal, Salespeople
from ..schemas.salesplan import SalesPlanCreate, SalesPlanUpdate


def get_salesplan(db: Session, salesplan_id: str):
    """Obtiene un plan de ventas por ID con sus objetivos relacionados"""
    return db.query(SalesPlan).options(
        joinedload(SalesPlan.goals).joinedload(SalespeopleGoal.salespeople)
    ).filter(SalesPlan.id == salesplan_id).first()


def get_salesplan_by_name(db: Session, plan_name: str):
    """Obtiene un plan de ventas por nombre"""
    return db.query(SalesPlan).filter(SalesPlan.plan_name == plan_name).first()


def get_salesplan_all(db: Session, skip: int = 0, limit: int = 10):
    """Obtiene todos los planes de ventas con paginación"""
    total = db.query(SalesPlan).count()
    salesplans = db.query(SalesPlan).options(
        joinedload(SalesPlan.goals).joinedload(SalespeopleGoal.salespeople)
    ).offset(skip).limit(limit).all()
    return {"salesplans": salesplans, "total": total}


def create_salesplan(db: Session, salesplan: SalesPlanCreate):
    """Crea un nuevo plan de ventas"""
    db_salesplan = SalesPlan(**salesplan.model_dump())
    db.add(db_salesplan)
    db.commit()
    db.refresh(db_salesplan)
    return db_salesplan


def update_salesplan(db: Session, salesplan_id: str, salesplan: SalesPlanUpdate):
    """Actualiza un plan de ventas existente"""
    db_salesplan = db.query(SalesPlan).filter(SalesPlan.id == salesplan_id).first()
    if not db_salesplan:
        return None
    update_data = salesplan.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_salesplan, key, value)
    db.add(db_salesplan)
    db.commit()
    db.refresh(db_salesplan)
    return db_salesplan


def delete_salesplan(db: Session, salesplan_id: str):
    """Elimina un plan de ventas (nota: considera las relaciones con salespeople_goals)"""
    db_salesplan = db.query(SalesPlan).filter(SalesPlan.id == salesplan_id).first()
    if not db_salesplan:
        return None
    db.delete(db_salesplan)
    db.commit()
    return db_salesplan