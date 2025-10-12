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

export interface BulkUploadRow {
  nombre: string;
  id_tax: string;
  direccion: string;
  telefono: string;
  correo: string;
  contacto: string;
  estado: string;
  certificado: Partial<Certificado> | null;
  rowNumber?: number;
}

export interface BulkUploadFile {
  filename: string;
  contentType: string;
  rows: BulkUploadRow[];
}

export interface BulkUploadError {
  rowNumber: number;
  errors: Record<string, unknown>[];
  rawData?: Record<string, unknown> | null;
}

export interface BulkUploadSummary {
  totalRows: number;
  processedRows: number;
  succeeded: number;
  failed: number;
}

export interface BulkUploadResponse {
  success: boolean;
  message: string;
  file: BulkUploadFile;
  summary: BulkUploadSummary;
  errors: BulkUploadError[];
  createdSuppliers: Proveedor[];
}

