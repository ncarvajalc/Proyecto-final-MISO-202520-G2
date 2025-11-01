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
