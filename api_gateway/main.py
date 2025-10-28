"""Simple FastAPI-based API gateway for routing frontend traffic."""

import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Optional, Tuple

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

PREFIX_ROUTES: Tuple[Tuple[str, str], ...] = (
    # Order matters: check longer prefixes first to avoid partial matches.
    ("/institutional-clients", "http://salesforce:8004"),
    ("/informes-comerciales", "http://salesforce:8004"),
    ("/planes-venta", "http://salesforce:8004"),
    ("/vendedores", "http://salesforce:8004"),
    ("/proveedores", "http://purchases_suppliers:8001"),
    ("/productos", "http://purchases_suppliers:8001"),
    ("/inventario", "http://warehouse:8003"),
    ("/vehiculos", "http://tracking:8002"),
    ("/paradas", "http://tracking:8002"),
    ("/bodegas", "http://warehouse:8003"),
    ("/visitas", "http://salesforce:8004"),
    ("/rutas", "http://tracking:8002"),
    ("/auth", "http://security_audit:8000"),
)

HEALTH_ENDPOINTS: Tuple[Tuple[str, str], ...] = (
    (
        "security_audit",
        "https://security-audit-212820187078.us-central1.run.app/health",
    ),
    (
        "purchases_suppliers",
        "https://purchases-suppliers-212820187078.us-central1.run.app/health",
    ),
    ("salesforce", "https://salesforce-212820187078.us-central1.run.app/health"),
    # TODO: Update with actual Cloud Run URL after deployment
    ("tracking", "https://tracking-212820187078.us-central1.run.app/health"),
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with httpx.AsyncClient(timeout=30.0) as client:
        app.state.client = client
        yield


app = FastAPI(title="MISO API Gateway", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root() -> Dict[str, str]:
    """Return a simple message indicating the gateway is running."""
    return {"message": "API Gateway running"}


HEALTHCHECK_TIMEOUT = httpx.Timeout(3.0, connect=1.0, read=2.0)


async def _check_service_health(
    client: httpx.AsyncClient, name: str, url: str
) -> Tuple[str, Dict[str, object], bool]:
    """Return the health payload for the given service without raising errors."""
    try:
        response = await client.get(url, timeout=HEALTHCHECK_TIMEOUT)
    except httpx.RequestError as exc:  # pragma: no cover - network failure path
        return name, {"status": "unreachable", "error": str(exc)}, False

    try:
        payload: object = response.json()
    except ValueError:
        payload = response.text

    healthy = response.is_success
    result: Dict[str, object] = {
        "status": "ok" if healthy else "error",
        "http_status": response.status_code,
        "detail": payload,
    }
    return name, result, healthy


@app.get("/health")
async def healthcheck() -> Dict[str, object]:
    """Aggregate the health of upstream services."""
    client: httpx.AsyncClient = app.state.client
    services: Dict[str, Dict[str, object]] = {}

    for name, url in HEALTH_ENDPOINTS:
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

    all_ok = True
    for name, result, healthy in await asyncio.gather(*tasks):
        services[name] = result
        all_ok &= healthy

    return {"status": "ok" if all_ok else "degraded", "services": services}


    # PREFIX_ROUTES is already sorted with longer prefixes first
    for prefix, upstream in PREFIX_ROUTES:
        if path == prefix or path.startswith(f"{prefix}/"):
            return prefix, upstream
    return None


@app.api_route(
    "/{full_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(full_path: str, request: Request) -> Response:
    """Proxy any request matching the configured prefixes to the upstream service."""
    upstream = _resolve_upstream(f"/{full_path}")
    if upstream is None:
        raise HTTPException(
            status_code=404, detail="No upstream service configured for path"
        )

    target_url = f"{upstream}{request.url.path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"

    body = await request.body()
    headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in REQUEST_HEADER_SKIP
    }

    client: httpx.AsyncClient = request.app.state.client

    try:
        upstream_response = await client.request(
            request.method,
            target_url,
            content=body,
            headers=headers,
            follow_redirects=False,
        )
    except httpx.RequestError as exc:  # pragma: no cover - network failure path
        raise HTTPException(
            status_code=502, detail=f"Upstream request failed: {exc}"
        ) from exc

    proxied_response = Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
    )

    for key, value in upstream_response.headers.multi_items():
        if key.lower() in RESPONSE_HEADER_SKIP:
            continue
        # Rewrite Location header for redirects to use gateway URL instead of internal service URLs
        if key.lower() == "location":
            # Replace internal service URLs with gateway URL
            for internal_prefix, internal_url in PREFIX_ROUTES:
                if value.startswith(internal_url):
                    # Replace internal URL with gateway URL (localhost:8080)
                    value = value.replace(internal_url, "http://localhost:8080")
                    break
        proxied_response.headers.append(key, value)

    return proxied_response

