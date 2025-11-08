import { API_BASE_URL } from "../config/api";

export interface Territory {
  id: string;
  name: string;
}

class TerritoriesService {
  async getCountries(): Promise<Territory[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/territorios/paises`);
      if (!response.ok) {
        throw new Error('Error al obtener países');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }

  async getStates(countryId: string): Promise<Territory[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/territorios/${countryId}/hijos`);
      if (!response.ok) {
        throw new Error('Error al obtener estados');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching states:', error);
      throw error;
    }
  }

  async getCities(stateId: string): Promise<Territory[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/territorios/${stateId}/hijos`);
      if (!response.ok) {
        throw new Error('Error al obtener ciudades');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }
  }
}

export const territoriesService = new TerritoriesService();