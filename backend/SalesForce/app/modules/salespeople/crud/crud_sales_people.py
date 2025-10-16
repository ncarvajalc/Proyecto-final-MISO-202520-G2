from sqlalchemy.orm import Session, joinedload

from ..models.salespeople_model import Salespeople
from ..schemas.salespeople import SalespeopleCreate, SalespeopleUpdate


def get_salespeople(db: Session, salespeople_id: str):
    return db.query(Salespeople).filter(Salespeople.id == salespeople_id).first()

def get_salespeople_with_plans(db: Session, salespeople_id: str):
    """Obtiene un vendedor con sus planes de venta cargados"""
    return db.query(Salespeople).options(
        joinedload(Salespeople.sales_plans)
    ).filter(Salespeople.id == salespeople_id).first()

def get_salespeople_by_email(db: Session, email: str):
    return db.query(Salespeople).filter(Salespeople.email == email).first()

def get_salespeople_all(db: Session, skip: int = 0, limit: int = 10):
    total = db.query(Salespeople).count()
    salespeople = db.query(Salespeople).offset(skip).limit(limit).all()
    return {"salespeople": salespeople, "total": total}

def create_salespeople(db: Session, salespeople: SalespeopleCreate):
    db_salespeople = Salespeople(**salespeople.model_dump())
    db.add(db_salespeople)
    db.commit()
    db.refresh(db_salespeople)
    return db_salespeople

def update_salespeople(db: Session, salespeople_id: str, salespeople: SalespeopleUpdate):
    db_salespeople = get_salespeople(db, salespeople_id)
    if not db_salespeople:
        return None
    update_data = salespeople.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_salespeople, key, value)
    db.add(db_salespeople)
    db.commit()
    db.refresh(db_salespeople)
    return db_salespeople

def delete_salespeople(db: Session, salespeople_id: str):
    db_salespeople = get_salespeople(db, salespeople_id)
    if not db_salespeople:
        return None
    db.delete(db_salespeople)
    db.commit()
    return db_salespeople