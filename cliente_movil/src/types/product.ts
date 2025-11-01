export interface Specification {
  nombre: string;
  valor: string;
}

export interface TechnicalSheet {
  urlManual?: string;
  urlHojaInstalacion?: string;
  certificaciones?: string[];
}

export interface Product {
  id: number;
  sku: string;
  nombre: string;
  descripcion: string;
  precio: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  especificaciones?: Specification[];
  hojaTecnica?: TechnicalSheet;
}

export interface ProductPaginated {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
