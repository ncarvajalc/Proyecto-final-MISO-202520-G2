from datetime import UTC, datetime

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.audit.schemas import AlertResponse, UnauthorizedOrderStatusAttempt
from app.modules.audit.services import AlertService

router = APIRouter(prefix="/alerts", tags=["Audit Alerts"])


@router.post(
    "/unauthorized-order-status",
    response_model=AlertResponse,
    status_code=status.HTTP_201_CREATED,
)
def report_unauthorized_order_status(
    payload: UnauthorizedOrderStatusAttempt, db: Session = Depends(get_db)
):
    detection_started_at = datetime.now(UTC)
    service = AlertService(db)
    alert, processing_ms = service.record_unauthorized_order_status_attempt(payload)

    elapsed_ms = int((datetime.now(UTC) - detection_started_at).total_seconds() * 1000)
    total_processing_ms = max(processing_ms, elapsed_ms)

    return AlertResponse(
        alert_id=alert.id,
        event_type=alert.event_type,
        severity=alert.severity,
        description=alert.description,
        detected_at=alert.detected_at,
        acknowledged=alert.acknowledged,
        processing_time_ms=total_processing_ms,
    )
