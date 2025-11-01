# Configuración de Variables de Entorno

Este documento explica cómo configurar las variables de entorno para el desarrollo de la aplicación móvil.

## Configuración Inicial

1. **Copia el archivo de ejemplo**
   ```bash
   cp .env.example .env
   ```

2. **Encuentra tu IP local**

   ### macOS / Linux:
   ```bash
   ipconfig getifaddr en0
   ```

   ### Windows:
   ```bash
   ipconfig
   ```
   Busca la dirección IPv4 de tu adaptador de red activo.

3. **Edita el archivo `.env`**
   ```
   EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:8080
   ```

   Ejemplo:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.100:8080
   ```

## Variables Disponibles

### `EXPO_PUBLIC_API_URL`
URL base del API Gateway del backend.

- **Desarrollo Web**: Usa `http://localhost:8080` (por defecto)
- **Desarrollo Móvil**: Usa la IP local de tu computadora, por ejemplo `http://192.168.1.100:8080`

**Importante**: Las variables en Expo deben tener el prefijo `EXPO_PUBLIC_` para estar disponibles en el cliente.

## Comportamiento por Defecto

Si no configuras la variable `EXPO_PUBLIC_API_URL`, la aplicación usará:
- **Web**: `http://localhost:8080`
- **Móvil**: `http://192.168.100.6:8080` (IP del desarrollador original)

## Después de Cambiar Variables de Entorno

Después de modificar el archivo `.env`, debes:

1. **Detener el servidor de desarrollo** (Ctrl+C)
2. **Limpiar la caché de Expo**:
   ```bash
   rm -rf .expo
   ```
3. **Reiniciar el servidor**:
   ```bash
   npm start
   ```

## Notas Importantes

- El archivo `.env` está en `.gitignore` - cada desarrollador debe tener su propia configuración
- El archivo `.env.example` SÍ se versiona en git como referencia
- Nunca incluyas credenciales o información sensible en `.env.example`
- Para desarrollo en dispositivo físico, asegúrate de que tu dispositivo y tu computadora estén en la misma red WiFi

## Verificar la Configuración

Para verificar qué URL está usando la aplicación, revisa los logs de la consola. El servicio de autenticación y visitas imprimirá la URL que está usando.

## Ejemplo de Configuración por Equipo

### Desarrollador 1 (IP: 192.168.1.100)
```bash
# .env
EXPO_PUBLIC_API_URL=http://192.168.1.100:8080
```

### Desarrollador 2 (IP: 192.168.1.105)
```bash
# .env
EXPO_PUBLIC_API_URL=http://192.168.1.105:8080
```

### Desarrollador 3 (IP: 10.0.0.50)
```bash
# .env
EXPO_PUBLIC_API_URL=http://10.0.0.50:8080
```

## Troubleshooting

### Error: "Network request failed"
- Verifica que el backend esté corriendo en el puerto 8080
- Verifica que la IP en `.env` sea correcta
- Verifica que tu dispositivo y computadora estén en la misma red
- En iOS, verifica que `app.json` tenga configurado `NSAllowsArbitraryLoads: true`
- En Android, verifica que `app.json` tenga `usesCleartextTraffic: true`

### La aplicación no ve los cambios en `.env`
- Limpia la caché: `rm -rf .expo`
- Reinicia Metro bundler
- Si usas Expo Go, cierra la app completamente y vuelve a abrirla
