import { getApiBaseUrl } from "../config/api";
import { Visit, VisitCreate, VisitsResponse } from "../types/visit";

export const visitService = {
  async getVisits(page: number = 1, limit: number = 10): Promise<VisitsResponse> {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/visitas/?page=${page}&limit=${limit}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Error al obtener visitas");
    }

    return response.json();
  },

  async createVisit(visit: VisitCreate): Promise<Visit> {
    const apiBaseUrl = getApiBaseUrl();

    // Check if files are provided
    const hasFiles = visit.files && visit.files.length > 0;

    let body: FormData | string;
    let headers: Record<string, string> = {};

    if (hasFiles) {
      // Use FormData for multipart/form-data when files are present
      const formData = new FormData();

      // Append form fields
      formData.append("nombre_institucion", visit.nombre_institucion);
      formData.append("direccion", visit.direccion);
      formData.append("hora", visit.hora);
      formData.append("estado", visit.estado);

      if (visit.desplazamiento_minutos !== undefined) {
        formData.append("desplazamiento_minutos", visit.desplazamiento_minutos.toString());
      }

      if (visit.hora_salida) {
        formData.append("hora_salida", visit.hora_salida);
      }

      if (visit.observacion) {
        formData.append("observacion", visit.observacion);
      }

      // Append files
      visit.files!.forEach((file) => {
        formData.append("files", {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);
      });

      body = formData;
      // Don't set Content-Type header - let the browser/fetch set it with boundary
    } else {
      // Use JSON when no files are provided
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(visit);
    }

    const response = await fetch(`${apiBaseUrl}/visitas/`, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error("Error al crear visita");
    }

    return response.json();
  },
};
