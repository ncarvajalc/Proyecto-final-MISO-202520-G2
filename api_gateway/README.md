# API Gateway del Proyecto MISO

Bienvenido. Este documento explica de forma clara y accionable qué es el API Gateway, cómo funciona, cómo ejecutarlo y cómo extenderlo sin experiencia previa en arquitecturas distribuidas.

## 1) Qué es y para qué sirve
El **API Gateway** es la puerta de entrada única para clientes web, móviles e integraciones externas. Centraliza las solicitudes HTTP, las enruta al microservicio correspondiente y devuelve la respuesta original del backend al consumidor.

Piensa en él como un recepcionista que recibe cada solicitud y la dirige al equipo correcto, cuidando que el mensaje llegue completo y vuelva la respuesta adecuada.

## 2) Componentes clave
- **FastAPI** como framework web.
- **httpx.AsyncClient** para proxy asíncrono de solicitudes.
- **CORS middleware** para permitir orígenes controlados.
- **Tablas de ruteo** en `main.py` (`PREFIX_ROUTES` y `HEALTH_ENDPOINTS`) para asignar prefijos a servicios y verificar salud.

Estructura:
- `main.py`: lógica del gateway.
- `Dockerfile`: contenedor de ejecución.
- `requirements.txt`: dependencias.

## 3) Cómo funciona internamente
El gateway se construye sobre **FastAPI**, que a su vez usa `uvicorn` para levantar un servidor ASGI (asíncrono). En `main.py`
se inicializa un único `httpx.AsyncClient` durante el evento de `startup`; de esa manera se reutilizan conexiones HTTP y se
impone un `timeout` de 30 s a todas las llamadas aguas abajo. Cada petición que llega se atiende dentro del *event loop* en
tres pasos claros:

1. **Resolver la ruta** (`_resolve_upstream`): ordena los prefijos de `PREFIX_ROUTES` por longitud descendente y encuentra el
   primero que coincide con la URL solicitada.
2. **Construir la URL de destino** (`proxy`): recompone el path completo (prefijo + sufijo), respeta el query string y reenvía
   método, cuerpo y cabeceras (excepto `Host` y `Content-Length`) con el cliente httpx compartido.
3. **Normalizar la respuesta**: recibe la respuesta cruda del microservicio, crea un `fastapi.Response` nuevo y filtra cabeceras
   hop-by-hop (`connection`, `transfer-encoding`, etc.) antes de devolverla al cliente.

El flujo garantiza que los consumidores nunca interactúen directamente con los microservicios y permite centralizar medidas de
seguridad, registro y observabilidad en un único punto.

## 4) Flujo de una petición
1. El cliente invoca una ruta, por ejemplo `GET /productos`.
2. `_resolve_upstream` busca el prefijo más largo configurado y lo asocia al host interno correspondiente.
3. `proxy` construye la URL final (`http://purchases_suppliers:8001/productos` en el ejemplo) y reenvía método, cabeceras y cuerpo con el cliente httpx compartido.
4. El gateway recibe la respuesta, genera un objeto `Response` nuevo y descarta cabeceras hop-by-hop antes de devolverla.
5. Si no hay coincidencia con ningún prefijo, lanza un `HTTPException` 404.

## 5) Mapa de rutas actuales (según `main.py`)
| Prefijo         | Microservicio destino | Dirección interna                 |
|-----------------|-----------------------|-----------------------------------|
| `/auth`         | Security & Audit      | `http://security_audit:8000`      |
| `/proveedores`  | Purchases & Suppliers | `http://purchases_suppliers:8001` |
| `/productos`    | Purchases & Suppliers | `http://purchases_suppliers:8001` |
| `/planes-venta` | Salesforce            | `http://salesforce:8004`          |
| `/vendedores`   | Salesforce            | `http://salesforce:8004`          |

> Nota: `docker-compose.yml` levanta también los servicios Tracking y Warehouse, pero aún no están expuestos por el gateway porque no tienen prefijos en `PREFIX_ROUTES`. Si necesitas habilitarlos, agrégalos tanto en el diccionario de rutas como en `HEALTH_ENDPOINTS`.

## 6) Endpoints del gateway
- `GET /`          → Mensaje de estado simple.
- `GET /health`    → Consulta `HEALTH_ENDPOINTS` (actualmente Security & Audit, Purchases & Suppliers y Salesforce) y devuelve un estado agregado `ok`, `degraded` o `unreachable` según la respuesta de cada microservicio.
- `/{cualquier}`   → Proxy según `PREFIX_ROUTES`.

## 7) Puesta en marcha local

### Opción A) Docker Compose (recomendada)
Requisitos: Docker y Docker Compose.

Ejecuta en la raíz del repositorio:
```bash
docker compose up -d
```
Accede:
```bash
curl http://localhost:8080/
curl http://localhost:8080/health
```

**Cómo se refleja en `docker-compose.yml`:**

- El servicio `api_gateway` se construye desde este mismo directorio y expone el puerto `8080` al host (`8080:8080`).
- La variable de entorno `PORT` se inyecta al contenedor y coincide con la usada por `uvicorn` en `main.py`.
- `depends_on: *backend-deps` obliga a que los servicios FastAPI (Security & Audit, Purchases & Suppliers, Tracking, Warehouse y Salesforce) estén saludables antes de iniciar el gateway. El ancla `*backend-deps` aprovecha los `healthcheck` declarados en cada servicio.
- El gateway participa en múltiples redes definidas en el compose (`frontend_net` y una red por dominio) para poder resolver los hosts internos `security_audit`, `purchases_suppliers`, `tracking`, `warehouse` y `salesforce` cuando reenvía tráfico.

En conjunto, esto permite que el endpoint `/health` del gateway utilice las URLs de `HEALTH_ENDPOINTS` y que las rutas de `PREFIX_ROUTES` funcionen tal como están escritas en el código.

### Opción B) Ejecución directa con Python
Requisitos: Python 3.11+.
```bash
cd api_gateway
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```
Si los microservicios no están levantados en las URLs configuradas, verás `502 Bad Gateway`.

## 8) Pruebas rápidas
Comprobar que responde:
```bash
curl http://localhost:8080/
```
Salud consolidada:
```bash
curl http://localhost:8080/health
```
Ejemplo de login si `security_audit` está activo:
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"demo","clave":"demo"}'
```

## 9) Agregar un nuevo microservicio
1. Define el servicio en `docker-compose.yml` y colócalo en una red compartida con el gateway.
2. En `api_gateway/main.py`, añade el prefijo en `PREFIX_ROUTES`.
3. Opcional: añade su URL en `HEALTH_ENDPOINTS` para incluirlo en `/health`.
4. Reinicia el gateway o el stack de Docker.

## 10) Observabilidad y registro
- Habilita niveles de log con variable de entorno `LOG_LEVEL`.
- Propaga y respeta identificadores de correlación (por ejemplo, `X-Request-ID`) para facilitar el trazado extremo a extremo.
- En producción, centraliza logs y métricas en tu stack de observabilidad.

## 11) Seguridad y producción
- CORS: en desarrollo puede estar abierto. En producción limita `allow_origins`, `allow_methods` y `allow_headers` a los dominios y métodos necesarios.
- Cabeceras hop-by-hop: el gateway filtra cabeceras no válidas para proxy (por ejemplo, `Connection`) y conserva las que facilitan trazabilidad.
- Timeouts y reintentos: configura tiempos de espera razonables al reenviar solicitudes para evitar cascadas de latencia.
- No expongas microservicios internos; publica únicamente el gateway.

## 12) Resolución de problemas
- **404 Not Found:** el prefijo no está en `PREFIX_ROUTES`.
- **502 Bad Gateway:** el destino no responde o la URL interna es incorrecta.
- **CORS bloqueado:** revisa la configuración del middleware en `main.py`.
- **Latencia alta:** valida timeouts y tamaño de payloads; confirma que las redes de Docker no estén saturadas.

## 13) Recursos
- FastAPI: https://fastapi.tiangolo.com/
- httpx: https://www.python-httpx.org/
- Patrón API Gateway: https://microservices.io/patterns/apigateway.html

Con esta guía puedes comprender, ejecutar y extender el API Gateway con confianza en entornos locales y productivos.
