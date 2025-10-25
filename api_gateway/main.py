"""Simple FastAPI-based API gateway for routing frontend traffic."""

from __future__ import annotations

from typing import Dict, Optional, Tuple

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

PREFIX_ROUTES: Dict[str, str] = {
    "/auth": "http://security_audit:8000",
    "/proveedores": "http://purchases_suppliers:8001",
    "/productos": "http://purchases_suppliers:8001",
    "/planes-venta": "http://salesforce:8004",
    "/vendedores": "http://salesforce:8004",
    "/informes-comerciales": "http://salesforce:8004",
    "/vehiculos": "http://tracking:8002",
    "/rutas": "http://tracking:8002",
    "/paradas": "http://tracking:8002",
    "/cliente": "http://salesforce:8004",
    "/vendedor": "http://salesforce:8004",
}

HEALTH_ENDPOINTS: Dict[str, str] = {
    "security_audit": "https://security-audit-212820187078.us-central1.run.app/health",
    "purchases_suppliers": "https://purchases-suppliers-212820187078.us-central1.run.app/health",
    "salesforce": "https://salesforce-212820187078.us-central1.run.app/health",
    # TODO: Update with actual Cloud Run URL after deployment
    "tracking": "https://tracking-212820187078.us-central1.run.app/health",
}

SUPPORTED_METHODS = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
    "HEAD",
]

app = FastAPI(title="MISO API Gateway")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup() -> None:
    app.state.client = httpx.AsyncClient(timeout=30.0)


@app.on_event("shutdown")
async def _shutdown() -> None:
    client: httpx.AsyncClient = app.state.client
    await client.aclose()


@app.get("/")
async def root() -> Dict[str, str]:
    """Return a simple message indicating the gateway is running."""
    return {"message": "API Gateway running"}


@app.get("/health")
async def healthcheck() -> Dict[str, object]:
    """Aggregate the health of upstream services."""
    client: httpx.AsyncClient = app.state.client
    services: Dict[str, Dict[str, object]] = {}
    all_ok = True

    for name, url in HEALTH_ENDPOINTS.items():
        try:
            response = await client.get(url)
            payload: object
            try:
                payload = response.json()
            except ValueError:
                payload = response.text

            healthy = response.status_code < 400
            services[name] = {
                "status": "ok" if healthy else "error",
                "http_status": response.status_code,
                "detail": payload,
            }
            all_ok = all_ok and healthy
        except httpx.RequestError as exc:  # pragma: no cover - network failure path
            services[name] = {
                "status": "unreachable",
                "error": str(exc),
            }
            all_ok = False

    return {"status": "ok" if all_ok else "degraded", "services": services}


def _resolve_upstream(path: str) -> Optional[Tuple[str, str]]:
    """Return the matching prefix and upstream base URL for a given path."""
    if not path.startswith("/"):
        path = f"/{path}"

    for prefix in sorted(PREFIX_ROUTES, key=len, reverse=True):
        if path == prefix or path.startswith(f"{prefix}/"):
            return prefix, PREFIX_ROUTES[prefix]
    return None


@app.api_route("/{full_path:path}", methods=SUPPORTED_METHODS)
async def proxy(full_path: str, request: Request) -> Response:
    """Proxy any request matching the configured prefixes to the upstream service."""
    resolved = _resolve_upstream(f"/{full_path}")
    if resolved is None:
        raise HTTPException(
            status_code=404, detail="No upstream service configured for path"
        )

    prefix, upstream = resolved
    prefix_without_leading = prefix[1:] if prefix.startswith("/") else prefix
    suffix = (
        full_path[len(prefix_without_leading) :]
        if prefix_without_leading
        else full_path
    )
    suffix = suffix or ""
    if suffix and not suffix.startswith("/"):
        suffix = f"/{suffix}"
    # Ensure we keep the full original path including the prefix
    target_path = f"{prefix}{suffix}"
    target_url = f"{upstream}{target_path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"

    body = await request.body()
    headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in {"host", "content-length"}
    }

    client: httpx.AsyncClient = request.app.state.client

    try:
        upstream_response = await client.request(
            request.method,
            target_url,
            content=body,
            headers=headers,
        )
    except httpx.RequestError as exc:  # pragma: no cover - network failure path
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    excluded_headers = {
        "content-length",
        "transfer-encoding",
        "connection",
        "keep-alive",
        "proxy-authenticate",
        "proxy-authorization",
        "te",
        "trailers",
        "upgrade",
    }

    proxied_response = Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
    )

    for key, value in upstream_response.headers.multi_items():
        if key.lower() in excluded_headers:
            continue
        proxied_response.headers.append(key, value)

    return proxied_response
