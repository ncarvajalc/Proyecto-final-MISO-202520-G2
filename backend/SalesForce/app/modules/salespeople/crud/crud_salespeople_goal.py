from sqlalchemy.orm import Session, joinedload
from ..models.salespeople_model import SalespeopleGoal, Salespeople, SalesPlan
from ..schemas.salespeoplegoal import SalespeopleGoalCreate, SalespeopleGoalUpdate


def get_salespeople_goal(db: Session, goal_id: str):
    """Obtiene un objetivo por ID con sus relaciones"""
    return db.query(SalespeopleGoal).options(
        joinedload(SalespeopleGoal.salespeople),
        joinedload(SalespeopleGoal.sales_plan)
    ).filter(SalespeopleGoal.id == goal_id).first()


def get_goals_by_salespeople(db: Session, salespeople_id: str):
    """Obtiene todos los objetivos de un vendedor específico"""
    return db.query(SalespeopleGoal).options(
        joinedload(SalespeopleGoal.sales_plan)
    ).filter(
        SalespeopleGoal.salespeople_id == salespeople_id
    ).all()


def get_goals_by_sales_plan(db: Session, sales_plan_id: str):
    """Obtiene todos los objetivos de un plan de ventas específico"""
    return db.query(SalespeopleGoal).options(
        joinedload(SalespeopleGoal.salespeople)
    ).filter(
        SalespeopleGoal.sales_plan_id == sales_plan_id
    ).all()


def get_goal_by_salespeople_and_plan(db: Session, salespeople_id: str, sales_plan_id: str):
    """Obtiene el objetivo de un vendedor en un plan específico"""
    return db.query(SalespeopleGoal).filter(
        SalespeopleGoal.salespeople_id == salespeople_id,
        SalespeopleGoal.sales_plan_id == sales_plan_id
    ).first()


def get_salespeople_goal_all(db: Session, skip: int = 0, limit: int = 10):
    """Obtiene todos los objetivos con paginación"""
    total = db.query(SalespeopleGoal).count()
    goals = db.query(SalespeopleGoal).options(
        joinedload(SalespeopleGoal.salespeople),
        joinedload(SalespeopleGoal.sales_plan)
    ).offset(skip).limit(limit).all()
    return {"goals": goals, "total": total}


def create_salespeople_goal(db: Session, goal: SalespeopleGoalCreate):
    """Crea un nuevo objetivo para un vendedor"""
    db_goal = SalespeopleGoal(**goal.model_dump())
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


def update_salespeople_goal(db: Session, goal_id: str, goal: SalespeopleGoalUpdate):
    """Actualiza un objetivo existente"""
    db_goal = db.query(SalespeopleGoal).filter(SalespeopleGoal.id == goal_id).first()
    if not db_goal:
        return None
    update_data = goal.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_goal, key, value)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


def delete_salespeople_goal(db: Session, goal_id: str):
    """Elimina un objetivo"""
    db_goal = db.query(SalespeopleGoal).filter(SalespeopleGoal.id == goal_id).first()
    if not db_goal:
        return None
    db.delete(db_goal)
    db.commit()
    return db_goal


def delete_goals_by_sales_plan(db: Session, sales_plan_id: str):
    """Elimina todos los objetivos asociados a un plan de ventas"""
    goals = db.query(SalespeopleGoal).filter(
        SalespeopleGoal.sales_plan_id == sales_plan_id
    ).all()
    for goal in goals:
        db.delete(goal)
    db.commit()
    return len(goals)


def delete_goals_by_salespeople(db: Session, salespeople_id: str):
    """Elimina todos los objetivos de un vendedor"""
    goals = db.query(SalespeopleGoal).filter(
        SalespeopleGoal.salespeople_id == salespeople_id
    ).all()
    for goal in goals:
        db.delete(goal)
    db.commit()
    return len(goals)
