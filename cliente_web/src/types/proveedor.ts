/**
 * Proveedor (Provider/Supplier) Types
 */

export interface Proveedor {
  id: string;
  nombre: string;
  idTax: string;
  direccion: string;
  telefono: string;
  correo: string;
  contacto: string;
  estado: "Activo" | "Inactivo";
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

