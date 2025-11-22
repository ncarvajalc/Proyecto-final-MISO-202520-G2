import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings
from app.modules.audit.models import SecurityAlert
from app.modules.audit.services.outbound_email_service import OutboundEmailService

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(
        self,
        smtp_host: str,
        smtp_port: int,
        sender_email: str,
        admin_email: str,
        timeout_seconds: int,
        delivery_mode: str = "capture",
        storage_service: OutboundEmailService | None = None,
    ) -> None:
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.sender_email = sender_email
        self.admin_email = admin_email
        self.timeout_seconds = timeout_seconds
        self.delivery_mode = delivery_mode
        self.storage_service = storage_service

    @classmethod
    def from_settings(cls, storage_service: OutboundEmailService | None) -> "EmailService":
        return cls(
            smtp_host=settings.smtp_host,
            smtp_port=settings.smtp_port,
            sender_email=settings.alert_sender_email,
            admin_email=settings.admin_email,
            timeout_seconds=settings.email_timeout_seconds,
            delivery_mode=settings.email_delivery_mode,
            storage_service=storage_service,
        )

    def send_alert_email(self, alert: SecurityAlert) -> None:
        message = EmailMessage()
        message["Subject"] = "Alerta de seguridad: consulta no autorizada"
        message["From"] = self.sender_email
        message["To"] = self.admin_email

        body_lines = [
            "Se detectó una consulta no autorizada al estado de un pedido.",
            f"ID alerta: {alert.id}",
            f"Evento: {alert.event_type}",
            f"Severidad: {alert.severity}",
            f"Pedido: {alert.order_id}",
            f"Actor: {alert.actor_id or 'desconocido'} (rol: {alert.actor_role or 'no provisto'})",
            f"Origen: {alert.source_ip or 'no provisto'}",
            f"Descripción: {alert.description}",
            f"Detectado: {alert.detected_at.isoformat() if alert.detected_at else 'N/D'}",
        ]
        message.set_content("\n".join(body_lines))

        body = message.get_content()

        if self.storage_service is not None:
            self.storage_service.save_email(self.admin_email, message["Subject"], body)

        if self.delivery_mode.lower() == "capture":
            return

        try:
            with smtplib.SMTP(
                self.smtp_host, self.smtp_port, timeout=self.timeout_seconds
            ) as smtp:
                smtp.send_message(message)
        except Exception as exc:  # noqa: BLE001 - capture and optionally swallow
            if settings.email_capture_on_failure and self.storage_service is not None:
                logger.warning("SMTP delivery failed, capturing email instead: %s", exc)
                return
            logger.exception("Failed to send alert email")
            raise
