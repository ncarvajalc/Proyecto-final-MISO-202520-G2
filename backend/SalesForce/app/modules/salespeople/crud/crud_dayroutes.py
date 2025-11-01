from sqlalchemy.orm import Session, joinedload

from ..models.salespeople_model import *
from ..schemas.dayroutes_schemas import *

def get_dayroute_bd(db: Session, salespeople_id: str):
    ...