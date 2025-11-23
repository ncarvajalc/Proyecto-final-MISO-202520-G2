from fastapi import APIRouter

from .alerts import router as alerts_router
from .emails import router as emails_router


audit_router = APIRouter(prefix="/audit")
audit_router.include_router(alerts_router)
audit_router.include_router(emails_router)

__all__ = ["audit_router"]
