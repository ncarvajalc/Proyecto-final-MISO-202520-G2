# Guía rápida: alerta por consulta no autorizada de pedidos (ASR-12)

Esta guía explica cómo validar manualmente, sin pasos técnicos complejos, que una consulta no autorizada al estado de un pedido genera una alerta y un correo al administrador en menos de 2 segundos.

## Prerrequisitos
- Servicios en marcha:
  - API Gateway en http://localhost:8080
  - Security & Audit en http://localhost:8000
  - Frontend cliente_web en http://localhost:3000
- Buzón del administrador visible:
  - Maildev en http://localhost:1080 **o**
  - Endpoint `GET http://localhost:8000/audit/emails`
- Email de admin configurado (por defecto `admin@example.com`).

## Paso a paso
1. **Limpiar el buzón**
   - Opción A: desde la UI de Maildev, borrar todos los mensajes.
   - Opción B: `DELETE http://localhost:8000/audit/emails`.
2. **Elegir un ID de pedido** al azar, por ejemplo `12345`.
3. **Lanzar el intento no autorizado**
   - Abrir `cliente_web` en una sesión sin autenticación (cierra sesión si aplica).
   - En otra pestaña o herramienta (curl, Postman), hacer `GET http://localhost:8080/pedidos/12345` sin cabeceras de autorización.
   - Confirmar que la respuesta es `403 Forbidden`.
4. **Verificar la alerta por correo**
   - Abrir Maildev (`http://localhost:1080`) y refrescar, **o**
   - Hacer `GET http://localhost:8000/audit/emails?limit=10` y buscar un mensaje:
     - Destinatario `admin@example.com` (o el configurado).
     - Asunto que contenga “Alerta de seguridad”.
5. **Comprobar el contenido**
   - El cuerpo debe mencionar una “consulta no autorizada”.
   - Debe incluir el ID de pedido usado (`12345`).
6. **Validar el tiempo**
   - Compara el momento de la petición no autorizada con la hora de recepción del correo (en Maildev o campo `created_at` del endpoint).
   - La diferencia debe ser **≤ 2 segundos**.

## Resultado esperado
- Petición rechazada con `403`.
- Alerta registrada.
- Correo de alerta enviado al admin con el ID del pedido, dentro de 2 segundos.
