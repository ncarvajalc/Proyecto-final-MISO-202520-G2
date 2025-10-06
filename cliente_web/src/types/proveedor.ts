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
  id: string;
  // Campos mínimos requeridos
  nombre: string;
  idTax: string;
  direccion: string;
  telefono: string;
  correo: string;
  contacto: string;
  estado: "Activo" | "Inactivo";
  // Campo opcional
  certificado?: Certificado;
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

