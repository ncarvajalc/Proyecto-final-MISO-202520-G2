/**
 * Warehouse Types
 */

export interface Bodega {
  id: string;
  nombre: string;
  ubicacion?: string;
}

export interface ProductLocation {
  sku: string;
  bodega: string;
  zona: string;
  encontrado: boolean;
}

export interface ProductLocationRequest {
  sku: string;
}

export interface ProductWarehouseLocationRequest {
  sku: string;
  bodegaId: string;
}

export interface ProductWarehouseLocation {
  sku: string;
  bodega: string;
  zona: string;
  encontrado: boolean;
}
