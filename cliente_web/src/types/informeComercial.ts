/**
 * Informe Comercial Types
 */

/**
 * Informe Comercial
 * Represents a commercial report with key sales indicators
 */
export interface InformeComercial {
  // Identificador del informe
  id: string;
  // Nombre del informe
  nombre: string;
  // Fecha de creación del informe
  fecha: string; // ISO 8601 format: "2025-10-18T10:30:00Z"
  // Indicadores clave (calculados)
  ventasTotales?: number; // Total sales value
  unidadesVendidas?: number; // Total units sold
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface InformesComercialResponse {
  data: InformeComercial[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
