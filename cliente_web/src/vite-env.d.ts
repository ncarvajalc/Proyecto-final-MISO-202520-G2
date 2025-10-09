/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE: string;
  readonly VITE_PROVEEDORES_API_URL: string;
  readonly VITE_PRODUCTOS_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}