from typing import List

from sqlalchemy.orm import Session

from app.modules.audit.models import OutboundEmail


class OutboundEmailService:
    def __init__(self, db: Session):
        self.db = db

    def save_email(self, to_address: str, subject: str, body: str) -> OutboundEmail:
        email = OutboundEmail(to_address=to_address, subject=subject, body=body)
        self.db.add(email)
        self.db.commit()
        self.db.refresh(email)
        return email

    def list_recent(self, limit: int) -> List[OutboundEmail]:
        return (
            self.db.query(OutboundEmail)
            .order_by(OutboundEmail.created_at.desc())
            .limit(limit)
            .all()
        )

    def clear_all(self) -> None:
        self.db.query(OutboundEmail).delete()
        self.db.commit()
