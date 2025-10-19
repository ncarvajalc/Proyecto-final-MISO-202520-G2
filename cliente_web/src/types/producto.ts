/**
 * Producto (Product) Types
 */

export interface Especificacion {
  nombre: string;
  valor: string;
}

export interface HojaTecnica {
  urlManual?: string;
  urlHojaInstalacion?: string;
  certificaciones?: string[];
}

export interface Producto {
  id: string;
  // Campos mínimos requeridos
  sku: string;
  nombre: string;
  descripcion: string;
  precio: number;
  // Campos opcionales
  especificaciones?: Especificacion[];
  hojaTecnica?: HojaTecnica;
  // Campo de sistema
  activo: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ProductosResponse {
  data: Producto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BulkProductError {
  id: string;
  row_number: string;
  row_status: string;
  error_message: string;
}


export interface BulkUploadProductsResponse {
  success: boolean;
  message: string;
  totalRows: number;
  succeededRows: number;
  failedRows: number;
  errors: BulkProductError[];
}

