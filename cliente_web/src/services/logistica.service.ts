/**
 * Logística Service
 *
 * Handles all API calls related to Logística (Logistics).
 * Includes vehicle management functionality.
 *
 * All requests go through the API Gateway.
 */

import type { VehiculosResponse, PaginationParams } from "@/types/logistica";
import { getApiBaseUrl } from "@/config/api";

/**
 * Backend response type for vehicles endpoint
 */
interface BackendVehiculo {
  id: string;
  placa: string;
  conductor: string;
  numeroEntregas: number;
}

interface BackendVehiculosResponse {
  data: BackendVehiculo[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * Fetch vehículos with pagination
 *
 * @param params - Pagination parameters (page and limit)
 * @returns Paginated list of vehículos
 *
 * Backend Contract:
 *
 * GET /vehiculos?page={page}&limit={limit}
 *
 * Query Parameters:
 * - page: number (required) - Page number (1-based)
 * - limit: number (required) - Items per page
 *
 * Response: 200 OK
 * Content-Type: application/json
 *
 * Response Body:
 * {
 *   "data": [
 *     {
 *       "id": "string",
 *       "placa": "string",
 *       "conductor": "string",
 *       "numeroEntregas": number
 *     }
 *   ],
 *   "total": number,
 *   "page": number,
 *   "limit": number,
 *   "total_pages": number
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid pagination parameters
 * - 500 Internal Server Error: Server error
 */
export const getVehiculos = async (
  params: PaginationParams
): Promise<VehiculosResponse> => {
  const { page, limit } = params;
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/vehiculos?page=${page}&limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const responseData: BackendVehiculosResponse = await response.json();

  // Map backend response to frontend types
  // Backend uses snake_case (total_pages), frontend uses camelCase (totalPages)
  return {
    data: responseData.data.map((vehiculo) => ({
      id: String(vehiculo.id), // Ensure ID is string
      placa: vehiculo.placa,
      conductor: vehiculo.conductor,
      numeroEntregas: vehiculo.numeroEntregas,
    })),
    total: responseData.total,
    page: responseData.page,
    limit: responseData.limit,
    totalPages: responseData.total_pages,
  };
};
