# Cliente móvil

Este paquete contiene la aplicación móvil del monorepo creada con Expo.

## Scripts disponibles

- `npm start`: inicia el servidor de desarrollo de Expo.
- `npm run android`: crea una compilación nativa para Android.
- `npm run ios`: crea una compilación nativa para iOS.
- `npm run web`: ejecuta la aplicación en un navegador web.
- `npm test`: ejecuta todos los conjuntos de pruebas.
- `npm run test:unit`: ejecuta únicamente las pruebas de unidad.
- `npm run test:integration`: ejecuta únicamente las pruebas de integración.
- `npm run test:functional`: ejecuta únicamente las pruebas funcionales de humo.

## Estructura de pruebas

Las pruebas se agrupan en el directorio `__tests__` y se clasifican en tres categorías:

- **Unitarias:** validan la lógica de componentes aislados como `Greeting`.
- **Integración:** aseguran que los componentes principales funcionen en conjunto.
- **Funcionales (smoke tests):** verifican que el árbol principal de la aplicación se renderice y responda a cambios simples.

Todas las pruebas se ejecutan con Jest utilizando la configuración provista en `jest.config.js`.

