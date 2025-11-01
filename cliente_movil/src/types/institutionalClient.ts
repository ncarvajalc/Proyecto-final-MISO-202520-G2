export interface InstitutionalClient {
  id: string;
  nombre_institucion: string;
  direccion: string;
  ciudad: string | null;
  pais: string | null;
  direccion_institucional: string; // email
  identificacion_tributaria: string; // NIT
  representante_legal: string;
  telefono: string;
  justificacion_acceso: string | null;
  certificado_camara: string | null;
  territory_id: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstitutionalClientCreate {
  nombre_institucion: string;
  direccion: string;
  direccion_institucional: string; // email
  identificacion_tributaria: string; // NIT
  representante_legal: string;
  telefono: string;
  justificacion_acceso?: string;
  certificado_camara?: string;
  territory_id?: string;
}

export interface InstitutionalClientUpdate {
  nombre_institucion?: string;
  direccion?: string;
  direccion_institucional?: string;
  representante_legal?: string;
  telefono?: string;
  justificacion_acceso?: string;
  certificado_camara?: string;
  territory_id?: string;
}

export interface InstitutionalClientsResponse {
  data: InstitutionalClient[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
