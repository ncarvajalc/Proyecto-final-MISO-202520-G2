/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE?: string;
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}