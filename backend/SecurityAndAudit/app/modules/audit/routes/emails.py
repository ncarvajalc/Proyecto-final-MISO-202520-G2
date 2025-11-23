from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.audit.schemas import OutboundEmailDTO, OutboundEmailListResponse
from app.modules.audit.services import OutboundEmailService

router = APIRouter(prefix="/emails", tags=["Audit Emails"])


@router.get("/", response_model=OutboundEmailListResponse)
def list_emails(limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    service = OutboundEmailService(db)
    messages = service.list_recent(limit)
    return OutboundEmailListResponse(
        total=len(messages),
        messages=[
            OutboundEmailDTO(
                id=message.id,
                to_address=message.to_address,
                subject=message.subject,
                body=message.body,
                created_at=message.created_at,
            )
            for message in messages
        ],
    )


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def clear_emails(db: Session = Depends(get_db)):
    service = OutboundEmailService(db)
    service.clear_all()
