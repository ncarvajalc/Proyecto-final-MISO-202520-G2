"""
Database initialization script
Creates all tables and optionally seeds initial data
"""

from sqlmodel import SQLModel
from app.core.database import engine

# Import all models to register them with SQLModel metadata
from app.modules.access.models import (  # noqa: F401
    User,
    Profile,
    Permission,
    ProfilePermission,
)
from app.modules.audit.models import Customer, Order  # noqa: F401


def init_db():
    """
    Initialize database tables
    This will create all tables defined in the models
    """
    # Create all tables
    # SQLModel.metadata contains all table definitions from models with table=True
    SQLModel.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


def drop_db():
    """
    Drop all database tables
    WARNING: This will delete all data!
    """
    SQLModel.metadata.drop_all(bind=engine)
    print("All database tables dropped!")


if __name__ == "__main__":
    print("Initializing database...")
    init_db()
