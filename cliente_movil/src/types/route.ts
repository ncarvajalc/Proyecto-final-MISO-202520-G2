// Shared Route type used across the app
export interface Ruta {
  id: string;
  nombreEntidad: string;
  tiempo: number;
  distancia: number;
  pais: string;
  ciudad: string;
  direccion: string;
}

export type RoutesResponse = Ruta[];
