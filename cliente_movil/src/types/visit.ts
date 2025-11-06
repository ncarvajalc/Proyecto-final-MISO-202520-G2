export interface VisitMultimedia {
  id: string;
  visit_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  nombre_institucion: string;
  direccion: string;
  hora: string;
  desplazamiento_minutos: number | null;
  hora_salida: string | null;
  estado: string;
  observacion: string | null;
  multimedia?: VisitMultimedia[];
  created_at: string;
  updated_at: string;
}

export interface MultimediaFile {
  uri: string;
  name: string;
  type: string;
}

export interface VisitCreate {
  nombre_institucion: string;
  direccion: string;
  hora: string;
  desplazamiento_minutos?: number;
  hora_salida?: string;
  estado: string;
  observacion?: string;
  files?: MultimediaFile[];
}

export interface VisitsResponse {
  data: Visit[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
