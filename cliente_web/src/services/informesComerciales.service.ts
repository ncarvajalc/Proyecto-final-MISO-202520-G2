/**
 * Informes Comerciales Service
 *
 * Handles all API calls related to Informes Comerciales (Commercial Reports) against the
 * SalesForce backend. The ApiClient automatically includes the JWT token in
 * every request so the service can focus on translating between the backend
 * contract and the shape expected by the UI.
 */

// TODO: Uncomment when backend is ready
// import { getApiBaseUrl } from "@/config/api";
// import { ApiClient } from "@/lib/api-client";
import type {
  InformeComercial,
  InformesComercialResponse,
  PaginationParams,
} from "@/types/informeComercial";

/**
 * Mock data for testing
 * TODO: Remove when backend is ready
 */
const MOCK_INFORMES_COMERCIALES: InformeComercial[] = [
  {
    id: "1",
    nombre: "Informe Q1 2025",
    fecha: "2025-03-31T23:59:59Z",
    ventasTotales: 125000.5,
    unidadesVendidas: 1250,
  },
  {
    id: "2",
    nombre: "Informe Trimestral",
    fecha: "2025-06-30T23:59:59Z",
    ventasTotales: 98750.25,
    unidadesVendidas: 987,
  },
  {
    id: "3",
    nombre: "Informe Anual 2024",
    fecha: "2024-12-31T23:59:59Z",
    ventasTotales: 450000.75,
    unidadesVendidas: 4500,
  },
  {
    id: "4",
    nombre: "Informe Mensual Octubre",
    fecha: "2025-10-18T10:30:00Z",
    ventasTotales: 32500.0,
    unidadesVendidas: 325,
  },
  {
    id: "5",
    nombre: "Informe Semanal",
    fecha: "2025-10-15T18:00:00Z",
    ventasTotales: 8750.5,
    unidadesVendidas: 87,
  },
];

/**
 * Fetch informes comerciales with pagination
 *
 * @param params - Pagination parameters (page and limit)
 * @returns Paginated list of informes comerciales
 *
 * Backend Contract Example:
 *
 * GET /api/informes-comerciales?page=1&limit=5
 *
 * Response:
 * {
 *   "data": [
 *     {
 *       "id": "1",
 *       "nombre": "Informe Q1 2025",
 *       "fecha": "2025-03-31T23:59:59Z",
 *       "ventasTotales": 125000.50,
 *       "unidadesVendidas": 1250
 *     },
 *     // ... more items
 *   ],
 *   "total": 100,        // Total number of records in database
 *   "page": 1,           // Current page
 *   "limit": 5,          // Items per page
 *   "totalPages": 20     // Total pages (calculated as Math.ceil(total / limit))
 * }
 *
 * Notes:
 * - fecha is in ISO 8601 format (UTC timezone)
 * - ventasTotales is the sum of all sales values in the report period
 * - unidadesVendidas is the sum of all units sold in the report period
 * - Both indicators are calculated from the sales data when the report is created
 *
 * TODO: Replace with real API call when backend is ready
 * Example implementation:
 * ```typescript
 * export const getInformesComerciales = async (params: PaginationParams): Promise<InformesComercialResponse> => {
 *   return apiClient.get<InformesComercialResponse>('/informes-comerciales', {
 *     params: {
 *       page: params.page,
 *       limit: params.limit
 *     }
 *   });
 * };
 * ```
 */
// TODO: Uncomment when backend is ready
// type BackendInformeComercial = {
//   id: string;
//   nombre: string;
//   fecha: string;
//   ventasTotales?: number;
//   ventas_totales?: number;
//   unidadesVendidas?: number;
//   unidades_vendidas?: number;
// };

// type BackendPaginatedResponse = {
//   data: BackendInformeComercial[];
//   total: number;
//   page: number;
//   limit: number;
//   totalPages?: number;
//   total_pages?: number;
// };

export const getInformesComerciales = async (
  params: PaginationParams
): Promise<InformesComercialResponse> => {
  // TODO: Replace with real API call
  // const apiClient = new ApiClient(getApiBaseUrl());
  // const response = await apiClient.get<BackendPaginatedResponse>("/informes-comerciales/", {
  //   params: {
  //     page: params.page,
  //     limit: params.limit,
  //   },
  // });

  // Mock implementation for now
  await new Promise((resolve) => setTimeout(resolve, 500));

  const startIndex = (params.page - 1) * params.limit;
  const endIndex = startIndex + params.limit;
  const paginatedData = MOCK_INFORMES_COMERCIALES.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    total: MOCK_INFORMES_COMERCIALES.length,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(MOCK_INFORMES_COMERCIALES.length / params.limit),
  };

  // Real implementation when backend is ready:
  // const normalizedData: InformeComercial[] = response.data.map((informe) => ({
  //   id: informe.id,
  //   nombre: informe.nombre,
  //   fecha: informe.fecha,
  //   ventasTotales: informe.ventasTotales ?? informe.ventas_totales ?? 0,
  //   unidadesVendidas: informe.unidadesVendidas ?? informe.unidades_vendidas ?? 0,
  // }));
  //
  // const totalPages =
  //   response.totalPages ??
  //   response.total_pages ??
  //   (response.total > 0 ? Math.ceil(response.total / params.limit) : 0);
  //
  // return {
  //   data: normalizedData,
  //   total: response.total,
  //   page: response.page,
  //   limit: response.limit,
  //   totalPages,
  // };
};

/**
 * Create a new informe comercial
 *
 * @param informeComercial - Informe comercial data without id
 * @returns Created informe comercial with calculated indicators
 *
 * Backend Contract Example:
 *
 * POST /api/informes-comerciales
 * Content-Type: application/json
 *
 * Request Body:
 * {
 *   "nombre": "Informe Mensual Noviembre"
 * }
 *
 * Response:
 * {
 *   "id": "6",
 *   "nombre": "Informe Mensual Noviembre",
 *   "fecha": "2025-11-01T10:15:30Z",          // Generated server-side (current timestamp)
 *   "ventasTotales": 42350.75,                // Calculated from all sales
 *   "unidadesVendidas": 423                   // Calculated from all sales
 * }
 *
 * Validation Rules:
 * - nombre: required, min 2 characters, max 100 characters
 *
 * Business Rules:
 * - fecha is automatically set to the current timestamp when the report is created
 * - ventasTotales is calculated as: SUM(ventas.cantidad * ventas.precio_unitario)
 * - unidadesVendidas is calculated as: SUM(ventas.cantidad)
 * - The calculation includes all sales data available at the time of report creation
 * - Both indicators are rounded to 2 decimal places for ventasTotales
 *
 * Error Responses:
 * - 400: Invalid nombre (missing or too short)
 * - 401: Unauthorized (invalid or missing JWT token)
 * - 500: Server error calculating indicators
 *
 * TODO: Replace with real API call when backend is ready
 * Example implementation:
 * ```typescript
 * export const createInformeComercial = async (
 *   informeComercial: Omit<InformeComercial, 'id' | 'fecha' | 'ventasTotales' | 'unidadesVendidas'>
 * ): Promise<InformeComercial> => {
 *   return apiClient.post<InformeComercial>('/informes-comerciales', informeComercial);
 * };
 * ```
 */
export const createInformeComercial = async (
  informeComercial: Omit<
    InformeComercial,
    "id" | "fecha" | "ventasTotales" | "unidadesVendidas"
  >
): Promise<InformeComercial> => {
  // TODO: Replace with real API call
  // const apiClient = new ApiClient(getApiBaseUrl());
  // const response = await apiClient.post<BackendInformeComercial>("/informes-comerciales/", {
  //   nombre: informeComercial.nombre,
  // });
  //
  // return {
  //   id: response.id,
  //   nombre: response.nombre,
  //   fecha: response.fecha,
  //   ventasTotales: response.ventasTotales ?? response.ventas_totales ?? 0,
  //   unidadesVendidas: response.unidadesVendidas ?? response.unidades_vendidas ?? 0,
  // };

  // Mock implementation for now
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newInforme: InformeComercial = {
    id: String(MOCK_INFORMES_COMERCIALES.length + 1),
    nombre: informeComercial.nombre,
    fecha: new Date().toISOString(),
    ventasTotales: Math.random() * 50000 + 10000, // Random for demo
    unidadesVendidas: Math.floor(Math.random() * 500 + 100), // Random for demo
  };

  MOCK_INFORMES_COMERCIALES.unshift(newInforme);

  return newInforme;
};
