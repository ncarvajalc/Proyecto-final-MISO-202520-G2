from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.modules.audit.models import SecurityAlert
from app.modules.audit.schemas import UnauthorizedOrderStatusAttempt
from app.modules.audit.services.email_service import EmailService
from app.modules.audit.services.outbound_email_service import OutboundEmailService


class AlertService:
    def __init__(
        self,
        db: Session,
        email_service: EmailService | None = None,
        email_store: OutboundEmailService | None = None,
    ) -> None:
        self.db = db
        self.email_store = email_store or OutboundEmailService(db)
        self.email_service = email_service or EmailService.from_settings(self.email_store)

    def record_unauthorized_order_status_attempt(self, payload: UnauthorizedOrderStatusAttempt):
        start_time = datetime.now(UTC)

        severity = (
            "critical" if payload.user_role not in {"admin", "operator"} else "high"
        )
        description = (
            f"Intento no autorizado de consultar el estado de un pedido. Pedido: {payload.order_id}."
        )
        if payload.reason:
            description = f"{description} Motivo: {payload.reason}"

        alert = SecurityAlert(
            event_type="unauthorized_order_status_query",
            severity=severity,
            description=description,
            actor_id=payload.user_id,
            actor_role=payload.user_role,
            order_id=payload.order_id,
            source_ip=payload.source_ip,
        )

        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)

        try:
            self.email_service.send_alert_email(alert)
        except Exception:
            pass

        processing_ms = int((datetime.now(UTC) - start_time).total_seconds() * 1000)
        return alert, processing_ms
