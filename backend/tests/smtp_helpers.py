from __future__ import annotations

from typing import Any, Dict, List

from aiosmtpd.controller import Controller


class MessageRecorder:
    def __init__(self) -> None:
        self.messages: List[Dict[str, Any]] = []

    async def handle_DATA(self, server, session, envelope):  # noqa: N802, ANN001
        self.messages.append(
            {
                "peer": session.peer,
                "mailfrom": envelope.mail_from,
                "rcpttos": envelope.rcpt_tos,
                "data": envelope.content.decode("utf-8", errors="replace"),
            }
        )
        return "250 Message accepted for delivery"


class SMTPServerController:
    def __init__(self, host: str, port: int) -> None:
        self.handler = MessageRecorder()
        self.controller = Controller(self.handler, hostname=host, port=port)

    def __enter__(self):
        self.controller.start()
        if hasattr(self.controller, "ready"):
            self.controller.ready.wait()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.controller.stop()

    @property
    def messages(self) -> List[Dict[str, Any]]:  # type: ignore[override]
        return self.handler.messages
