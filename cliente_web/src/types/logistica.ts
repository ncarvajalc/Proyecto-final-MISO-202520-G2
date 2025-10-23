/**
 * Logística Types
 */

export interface Vehiculo {
  id: string;
  placa: string;
  conductor: string;
  numeroEntregas: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface VehiculosResponse {
  data: Vehiculo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LogisticaProducto {
  sku: string;
  nombre: string;
  descripcion?: string;
}

export interface Bodega {
  id: string;
  nombre: string;
  codigo?: string;
}

export interface ProductWarehouseLocation {
  location: string | null;
  message?: string;
}

export interface ProductAvailability {
  warehouseId: string | null;
  warehouseName: string | null;
  message?: string;
}
