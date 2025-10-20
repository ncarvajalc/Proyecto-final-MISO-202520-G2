export interface Visit {
  id: string;
  nombre_institucion: string;
  direccion: string;
  hora: string;
  desplazamiento_minutos: number | null;
  hora_salida: string | null;
  estado: string;
  observacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitCreate {
  nombre_institucion: string;
  direccion: string;
  hora: string;
  desplazamiento_minutos?: number;
  hora_salida?: string;
  estado: string;
  observacion?: string;
}

export interface VisitsResponse {
  data: Visit[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
