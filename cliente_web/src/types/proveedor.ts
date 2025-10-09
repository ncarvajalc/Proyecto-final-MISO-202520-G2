/**
 * Proveedor (Provider/Supplier) Types
 */

export interface Certificado {
  nombre: string;
  cuerpoCertificador: string;
  fechaCertificacion: string;
  fechaVencimiento: string;
  urlDocumento: string;
}

export interface Proveedor {
  id: number;
  // Campos mínimos requeridos
  nombre: string;
  id_tax: string | null;
  direccion: string;
  telefono: string;
  correo: string;
  contacto: string;
  estado: "Activo" | "Inactivo" | null;
  // Campo opcional
  certificado: Certificado | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ProveedoresResponse {
  data: Proveedor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

