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

export interface ProductosResponse {
  data: Producto[];
  total: number;
}

