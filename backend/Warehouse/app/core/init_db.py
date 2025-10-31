"""
Database initialization script
Creates all tables and optionally seeds initial data
"""

from app.core.database import Base, engine

# Import all models to register them with SQLAlchemy metadata
# Using the simple inventory system (Integer-based)
from app.modules.inventory.models.warehouse import Warehouse  # noqa: F401
from app.modules.inventory.models.inventory import Inventory  # noqa: F401


def init_db():
    """
    Initialize database tables
    This will create all tables defined in the models
    """
    # Create all tables
    # Base.metadata contains all table definitions from models
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


def drop_db():
    """
    Drop all database tables
    WARNING: This will delete all data!
    """
    Base.metadata.drop_all(bind=engine)
    print("All database tables dropped!")


if __name__ == "__main__":
    print("Initializing database...")
    init_db()
