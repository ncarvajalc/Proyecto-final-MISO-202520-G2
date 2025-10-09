/**
 * Vendedor (Salesperson) Types
 */

/**
 * Plan de Venta
 * Represents a sales plan assigned to a vendedor
 */
export interface PlanDeVenta {
  // Identificador del plan
  identificador: string;
  // Campos mínimos requeridos
  nombre: string;
  descripcion: string;
  periodo: string; // e.g., "2025-Q1", "Enero 2025", etc.
  meta: number; // Sales target/goal
  // Indicadores clave
  unidadesVendidas: number;
}

export interface Vendedor {
  id: string;
  // Campos mínimos requeridos
  nombre: string;
  correo: string;
  // Campo de sistema - asignado automáticamente en backend
  fechaContratacion: string; // ISO 8601 date string
  // Plan de venta asociado (opcional)
  planDeVenta?: PlanDeVenta | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface VendedoresResponse {
  data: Vendedor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

