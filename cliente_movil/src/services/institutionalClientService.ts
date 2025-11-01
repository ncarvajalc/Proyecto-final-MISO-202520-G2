import { getApiBaseUrl } from "../config/api";
import {
  InstitutionalClient,
  InstitutionalClientCreate,
  InstitutionalClientUpdate,
  InstitutionalClientsResponse,
} from "../types/institutionalClient";

export const institutionalClientService = {
  async getInstitutionalClients(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<InstitutionalClientsResponse> {
    const apiBaseUrl = getApiBaseUrl();
    let url = `${apiBaseUrl}/institutional-clients/?page=${page}&limit=${limit}`;

    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Error al obtener clientes institucionales");
    }

    return response.json();
  },

  async getInstitutionalClientsCartera(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<InstitutionalClientsResponse> {
    const apiBaseUrl = getApiBaseUrl();
    let url = `${apiBaseUrl}/institutional-clients/cartera/?page=${page}&limit=${limit}`;

    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Error al obtener clientes institucionales");
    }

    return response.json();
  },

  async getInstitutionalClient(id: string): Promise<InstitutionalClient> {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/institutional-clients/${id}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Error al obtener el cliente institucional");
    }

    return response.json();
  },

  async createInstitutionalClient(
    client: InstitutionalClientCreate
  ): Promise<InstitutionalClient> {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/institutional-clients/`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(client),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Error al crear cliente institucional");
    }

    return response.json();
  },

  async updateInstitutionalClient(
    id: string,
    client: InstitutionalClientUpdate
  ): Promise<InstitutionalClient> {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/institutional-clients/${id}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(client),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Error al actualizar cliente institucional");
    }

    return response.json();
  },

  async deleteInstitutionalClient(id: string): Promise<void> {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/institutional-clients/${id}`;
    const response = await fetch(url, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Error al eliminar cliente institucional");
    }
  },
};
