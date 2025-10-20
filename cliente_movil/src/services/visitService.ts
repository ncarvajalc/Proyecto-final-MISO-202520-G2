import { getApiBaseUrl } from "../config/api";
import { VisitCreate, VisitsResponse } from "../types/visit";

export const visitService = {
  async getVisits(page: number = 1, limit: number = 10): Promise<VisitsResponse> {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/visitas/?page=${page}&limit=${limit}`;
    console.log("Fetching visits from:", url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Error al obtener visitas");
    }

    return response.json();
  },

  async createVisit(visit: VisitCreate): Promise<void> {
    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/visitas/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(visit),
    });

    if (!response.ok) {
      throw new Error("Error al crear visita");
    }
  },
};
