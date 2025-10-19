/**
 * Plan de Venta Types
 */

/**
 * Plan de Venta
 * Represents a sales plan that can be assigned to a vendedor
 */
export interface PlanVenta {
  // Identificador del plan
  id: string;
  identificador: string;
  // Campos mínimos requeridos
  nombre: string;
  descripcion: string;
  periodo: string; // e.g., "2025-Q1", "Enero 2025", etc.
  meta: number; // Sales target/goal
  // Vendedor asignado
  vendedorId: string;
  vendedorNombre?: string; // Populated from vendedor relation
  // Indicadores clave (calculados)
  unidadesVendidas?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PlanesVentaResponse {
  data: PlanVenta[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

