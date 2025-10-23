/**
 * Logística Service
 *
 * Handles all API calls related to Logística (Logistics).
 * Currently uses mock data for vehicle management functionality.
 *
 * All requests go through the API Gateway.
 */

import type {
  Vehiculo,
  VehiculosResponse,
  PaginationParams,
} from "@/types/logistica";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getApiBaseUrl } from "@/config/api";

// Mock data for vehicles
const MOCK_VEHICULOS: Vehiculo[] = [
  { id: "1", placa: "ABC-123", conductor: "Juan Pérez", numeroEntregas: 5 },
  { id: "2", placa: "DEF-456", conductor: "María García", numeroEntregas: 3 },
  { id: "3", placa: "GHI-789", conductor: "Carlos López", numeroEntregas: 7 },
  { id: "4", placa: "JKL-012", conductor: "Ana Martínez", numeroEntregas: 2 },
  { id: "5", placa: "MNO-345", conductor: "Luis Rodríguez", numeroEntregas: 4 },
  { id: "6", placa: "PQR-678", conductor: "Sofia Torres", numeroEntregas: 6 },
  { id: "7", placa: "STU-901", conductor: "Diego Ramírez", numeroEntregas: 8 },
  {
    id: "8",
    placa: "VWX-234",
    conductor: "Laura Hernández",
    numeroEntregas: 1,
  },
  { id: "9", placa: "YZA-567", conductor: "Pedro Sánchez", numeroEntregas: 9 },
  { id: "10", placa: "BCD-890", conductor: "Carmen Díaz", numeroEntregas: 3 },
  { id: "11", placa: "EFG-123", conductor: "Roberto Cruz", numeroEntregas: 5 },
  {
    id: "12",
    placa: "HIJ-456",
    conductor: "Patricia Morales",
    numeroEntregas: 4,
  },
];

/**
 * Fetch vehículos with pagination
 *
 * @param params - Pagination parameters (page and limit)
 * @returns Paginated list of vehículos
 *
 * Backend Contract for Backend Team:
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
 * Example Response:
 * ```json
 * {
 *   "data": [
 *     {
 *       "id": "1",
 *       "placa": "ABC-123",
 *       "conductor": "Juan Pérez",
 *       "numeroEntregas": 5
 *     },
 *     {
 *       "id": "2",
 *       "placa": "DEF-456",
 *       "conductor": "María García",
 *       "numeroEntregas": 3
 *     }
 *   ],
 *   "total": 12,
 *   "page": 1,
 *   "limit": 5,
 *   "total_pages": 3
 * }
 * ```
 *
 * Error Responses:
 * - 400 Bad Request: Invalid pagination parameters
 * - 500 Internal Server Error: Server error
 *
 * TODO: Replace with real API call when backend is ready
 * Example:
 * ```
 * export const getVehiculos = async (params: PaginationParams): Promise<VehiculosResponse> => {
 *   const baseUrl = getApiBaseUrl();
 *   const url = `${baseUrl}/vehiculos?page=${params.page}&limit=${params.limit}`;
 *
 *   const response = await fetch(url, {
 *     headers: {
 *       'Content-Type': 'application/json',
 *     },
 *   });
 *
 *   if (!response.ok) {
 *     throw new Error(`HTTP error! status: ${response.status}`);
 *   }
 *
 *   const responseData = await response.json();
 *
 *   return {
 *     data: responseData.data.map((vehiculo: any) => ({
 *       ...vehiculo,
 *       id: String(vehiculo.id)
 *     })),
 *     total: responseData.total,
 *     page: responseData.page,
 *     limit: responseData.limit,
 *     totalPages: responseData.total_pages,
 *   };
 * };
 * ```
 */
export const getVehiculos = async (
  params: PaginationParams
): Promise<VehiculosResponse> => {
  // MOCK DATA - Simulating API call with pagination
  return new Promise((resolve) => {
    setTimeout(() => {
      const { page, limit } = params;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const paginatedData = MOCK_VEHICULOS.slice(startIndex, endIndex);
      const total = MOCK_VEHICULOS.length;
      const totalPages = Math.ceil(total / limit);

      resolve({
        data: paginatedData,
        total,
        page,
        limit,
        totalPages,
      });
    }, 500); // Simulate network delay
  });
};
