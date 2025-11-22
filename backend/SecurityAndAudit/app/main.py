import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from sqlalchemy import text

from app.core.database import SessionLocal
from app.modules.access.routes import auth_router
from app.modules.audit.routes import audit_router

# Initialize FastAPI app
app = FastAPI(
    title="Security and Audit API",
    description="Authentication, authorization, and business audit service with RBAC",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(audit_router)

# Health check endpoint
@app.get("/health", tags=["health"])
def healthcheck():
    """Health check endpoint - verifies API and database connectivity"""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ok", "db": True}
    except OperationalError:
        return {"status": "error", "db": False}

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI on Cloud Run!"}

# --------------------------------------------
# Entry point para Cloud Run
# --------------------------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))  # Cloud Run asigna PORT automáticamente
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
