"""Minimal synchronous ASGI test client used by the backend tests."""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from types import TracebackType
from typing import Any, Dict, Iterable, Mapping, MutableMapping, Optional, Tuple, Type
from urllib.parse import urlencode, urljoin, urlsplit


@dataclass
class Response:
    status_code: int
    headers: Dict[str, str]
    content: bytes

    @property
    def text(self) -> str:
        return self.content.decode("utf-8", errors="replace")

    def json(self) -> Any:
        if not self.content:
            return None
        return json.loads(self.content.decode("utf-8"))


class TestClient:
    def __init__(
        self,
        app: Any,
        base_url: str = "http://testserver",
        *,
        raise_server_exceptions: bool = True,
    ) -> None:
        self.app = app
        self.base_url = base_url.rstrip("/") or "http://testserver"
        self.raise_server_exceptions = raise_server_exceptions
        self._closed = False

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def get(self, url: str, *, params: Optional[Mapping[str, Any]] = None) -> Response:
        return self.request("GET", url, params=params)

    def post(
        self,
        url: str,
        *,
        json: Optional[Any] = None,
        params: Optional[Mapping[str, Any]] = None,
    ) -> Response:
        return self.request("POST", url, json=json, params=params)

    def put(
        self,
        url: str,
        *,
        json: Optional[Any] = None,
        params: Optional[Mapping[str, Any]] = None,
    ) -> Response:
        return self.request("PUT", url, json=json, params=params)

    def patch(
        self,
        url: str,
        *,
        json: Optional[Any] = None,
        params: Optional[Mapping[str, Any]] = None,
    ) -> Response:
        return self.request("PATCH", url, json=json, params=params)

    def delete(
        self,
        url: str,
        *,
        params: Optional[Mapping[str, Any]] = None,
    ) -> Response:
        return self.request("DELETE", url, params=params)

    def request(
        self,
        method: str,
        url: str,
        *,
        json: Optional[Any] = None,
        params: Optional[Mapping[str, Any]] = None,
        headers: Optional[Mapping[str, str]] = None,
    ) -> Response:
        if self._closed:
            raise RuntimeError("Cannot send requests on a closed TestClient")

        path, query = self._prepare_url(url, params)
        body = b""
        request_headers: Dict[str, str] = {"host": urlsplit(self.base_url).netloc or "testserver"}
        if headers:
            request_headers.update({k.lower(): v for k, v in headers.items()})

        if json is not None:
            body = json_dumps(json)
            request_headers.setdefault("content-type", "application/json")

        scope = {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": method.upper(),
            "scheme": urlsplit(self.base_url).scheme or "http",
            "path": path,
            "raw_path": path.encode("latin-1"),
            "query_string": query.encode("latin-1"),
            "headers": [(k.encode("latin-1"), v.encode("latin-1")) for k, v in request_headers.items()],
            "client": ("testclient", 50000),
            "server": (urlsplit(self.base_url).hostname or "testserver", urlsplit(self.base_url).port or 80),
            "state": {},
        }

        try:
            status_code, response_headers, content = asyncio.run(
                self._dispatch(scope, body)
            )
        except Exception:  # pragma: no cover - pass through for visibility
            if self.raise_server_exceptions:
                raise
            status_code, response_headers, content = 500, {}, b""

        return Response(status_code=status_code, headers=response_headers, content=content)

    def close(self) -> None:
        self._closed = True

    # ------------------------------------------------------------------
    # Context manager helpers
    # ------------------------------------------------------------------
    def __enter__(self) -> "TestClient":
        return self

    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc: Optional[BaseException],
        tb: Optional[TracebackType],
    ) -> None:
        self.close()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _prepare_url(
        self,
        url: str,
        params: Optional[Mapping[str, Any]] = None,
    ) -> Tuple[str, str]:
        target = urljoin(self.base_url + "/", url.lstrip("/")) if "://" not in url else url
        parsed = urlsplit(target)
        query_parts = [parsed.query] if parsed.query else []
        if params:
            query_parts.append(urlencode(list(_expand_params(params)), doseq=True))
        query = "&".join(filter(None, query_parts))
        path = parsed.path or "/"
        return path, query

    async def _dispatch(self, scope: MutableMapping[str, Any], body: bytes) -> Tuple[int, Dict[str, str], bytes]:
        response_start: Optional[Mapping[str, Any]] = None
        body_chunks: list[bytes] = []

        body_sent = False

        async def receive() -> Mapping[str, Any]:
            nonlocal body_sent
            if not body_sent:
                body_sent = True
                return {"type": "http.request", "body": body, "more_body": False}
            return {"type": "http.disconnect"}

        async def send(message: Mapping[str, Any]) -> None:
            nonlocal response_start
            if message["type"] == "http.response.start":
                response_start = message
            elif message["type"] == "http.response.body":
                body_chunks.append(message.get("body", b""))

        await self.app(scope, receive, send)

        if response_start is None:
            raise RuntimeError("ASGI application did not send a response")

        status = int(response_start.get("status", 500))
        header_items = response_start.get("headers", [])
        headers_dict = {k.decode("latin-1"): v.decode("latin-1") for k, v in header_items}
        return status, headers_dict, b"".join(body_chunks)


def _expand_params(params: Mapping[str, Any]) -> Iterable[Tuple[str, Any]]:
    for key, value in params.items():
        if isinstance(value, (list, tuple)):
            for item in value:
                yield key, item
        else:
            yield key, value


def json_dumps(data: Any) -> bytes:
    return json.dumps(data, default=str).encode("utf-8")


__all__ = ["TestClient", "Response"]
