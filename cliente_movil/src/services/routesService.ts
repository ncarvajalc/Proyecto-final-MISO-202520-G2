import { getApiBaseUrl } from "../config/api";
import { Ruta, RoutesResponse } from "../types/route";

const apiBase = getApiBaseUrl();

// Sample/fallback data (moved from RutasScreen)
export const SAMPLE_ROUTES: Ruta[] = [
  {
    id: "r1",
    nombreEntidad: "Banco Central",
    tiempo: 15,
    distancia: 3.2,
    pais: "Argentina",
    ciudad: "Buenos Aires",
    direccion: "Av. Corrientes 345, C1043",
  },
  {
    id: "r2",
    nombreEntidad: "Universidad Nacional",
    tiempo: 30,
    distancia: 7.8,
    pais: "Argentina",
    ciudad: "Córdoba",
    direccion: "Bv. de la Reforma s/n, X5000",
  },
  {
    id: "r3",
    nombreEntidad: "Hospital General",
    tiempo: 5,
    distancia: 1.1,
    pais: "Chile",
    ciudad: "Santiago",
    direccion: "Calle Los Pinos 102, Providencia",
  },
  {
    id: "r4",
    nombreEntidad: "Fábrica de Insumos",
    tiempo: 45,
    distancia: 25.5,
    pais: "México",
    ciudad: "Guadalajara",
    direccion: "Blvd. Industrial 500, Zapopan",
  },
];

/**
 * Fetch routes assigned to a salesperson by id.
 * Endpoint: GET `${apiBase}/routes/salesperson/${id}`
 * Returns parsed JSON as Ruta[] on success. On network or parsing error,
 * returns SAMPLE_ROUTES as a graceful fallback.
 */
export const getRoutesBySalesperson = async (id: string, latitude: number, longitude:number): Promise<RoutesResponse> => {
  if (!id) {
    // If no id provided, return sample data immediately
    return SAMPLE_ROUTES;
  }

  const url = `${apiBase}/daily-routes/salesperson?salespeople_id=${encodeURIComponent(id)}&latitude=${latitude}&longitude=${longitude}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      // non-2xx response: log and return fallback
      console.warn("routesService: server returned non-ok status", res.status);
      return SAMPLE_ROUTES;
    }

    const data = (await res.json()) as RoutesResponse;
    // Basic validation: ensure array
    if (!Array.isArray(data)) {
      console.warn("routesService: unexpected response format, expected array");
      return SAMPLE_ROUTES;
    }

    return data;
  } catch (err) {
    console.warn("routesService: fetch failed", err);
    return SAMPLE_ROUTES;
  }
};

export default {
  getRoutesBySalesperson,
};
