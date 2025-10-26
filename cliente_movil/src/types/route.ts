// Shared Route type used across the app
export interface Ruta {
  id: string;
  nombreEntidad: string;
  minutosLlegada: number;
  distanciaKm: number;
  distanciaRealKm: number | null;
  pais: string;
  ciudad: string;
  direccion: string;
  destinoCoords: string;
}

export type RoutesResponse = Ruta[];
