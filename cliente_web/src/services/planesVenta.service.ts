/**
 * Planes de Venta Service
 * 
 * Handles all API calls related to Planes de Venta (Sales Plans).
 * Currently using mock data - replace with real API calls when backend is ready.
 * 
 * The apiClient automatically includes JWT token in all requests.
 */

// import { apiClient } from "@/lib/api-client";
import type { PlanVenta, PlanesVentaResponse, PaginationParams } from "@/types/planVenta";

/**
 * Mock data for testing
 * TODO: Remove when backend is ready
 */
const MOCK_PLANES_VENTA: PlanVenta[] = [
  {
    id: "1",
    identificador: "PV-2025-Q1",
    nombre: "Plan Q1 2025",
    descripcion: "Plan de ventas para el primer trimestre 2025",
    periodo: "Q1 2025",
    meta: 200,
    vendedorId: "1",
    vendedorNombre: "Carlos Mendoza",
    unidadesVendidas: 100,
  },
  {
    id: "2",
    identificador: "PV-2025-Q1",
    nombre: "Plan Q1 2025",
    descripcion: "Plan de ventas para el primer trimestre 2025",
    periodo: "Q1 2025",
    meta: 250,
    vendedorId: "2",
    vendedorNombre: "Ana Patricia López",
    unidadesVendidas: 200,
  },
  {
    id: "3",
    identificador: "PV-2025-Q1",
    nombre: "Plan Q1 2025",
    descripcion: "Plan de ventas para el primer trimestre 2025",
    periodo: "Q1 2025",
    meta: 180,
    vendedorId: "3",
    vendedorNombre: "Roberto Díaz",
    unidadesVendidas: 150,
  },
  {
    id: "4",
    identificador: "PV-2025-Q1",
    nombre: "Plan Q1 2025",
    descripcion: "Plan de ventas para el primer trimestre 2025",
    periodo: "Q1 2025",
    meta: 220,
    vendedorId: "4",
    vendedorNombre: "María Fernanda García",
    unidadesVendidas: 180,
  },
  {
    id: "5",
    identificador: "PV-2025-Q1",
    nombre: "Plan Q1 2025",
    descripcion: "Plan de ventas para el primer trimestre 2025",
    periodo: "Q1 2025",
    meta: 300,
    vendedorId: "5",
    vendedorNombre: "Luis Alberto Ramírez",
    unidadesVendidas: 250,
  },
  {
    id: "6",
    identificador: "PV-2024-Q4",
    nombre: "Plan Q4 2024",
    descripcion: "Plan de ventas para el cuarto trimestre 2024",
    periodo: "Q4 2024",
    meta: 190,
    vendedorId: "7",
    vendedorNombre: "Jorge Enrique Castro",
    unidadesVendidas: 120,
  },
  {
    id: "7",
    identificador: "PV-2025-Q2",
    nombre: "Plan Q2 2025",
    descripcion: "Plan de ventas para el segundo trimestre 2025",
    periodo: "Q2 2025",
    meta: 280,
    vendedorId: "1",
    vendedorNombre: "Carlos Mendoza",
    unidadesVendidas: 0,
  },
];

/**
 * Fetch planes de venta with pagination
 * 
 * @param params - Pagination parameters (page and limit)
 * @returns Paginated list of planes de venta
 * 
 * Backend Contract Example:
 * 
 * GET /api/planes-venta?page=1&limit=5
 * 
 * Response:
 * {
 *   "data": [
 *     {
 *       "id": "1",
 *       "identificador": "PV-2025-Q1",
 *       "nombre": "Plan Q1 2025",
 *       "descripcion": "Plan de ventas para el primer trimestre 2025",
 *       "periodo": "Q1 2025",
 *       "meta": 200,
 *       "vendedorId": "1",
 *       "vendedorNombre": "Carlos Mendoza",
 *       "unidadesVendidas": 100
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
 * - vendedorNombre is populated from the vendedor relation
 * - unidadesVendidas is calculated from sales data
 * 
 * TODO: Replace with real API call when backend is ready
 * Example implementation:
 * ```typescript
 * export const getPlanesVenta = async (params: PaginationParams): Promise<PlanesVentaResponse> => {
 *   return apiClient.get<PlanesVentaResponse>('/planes-venta', {
 *     params: {
 *       page: params.page,
 *       limit: params.limit
 *     }
 *   });
 * };
 * ```
 */
export const getPlanesVenta = async (params: PaginationParams): Promise<PlanesVentaResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simulate server-side pagination
  const startIndex = (params.page - 1) * params.limit;
  const endIndex = startIndex + params.limit;
  const paginatedData = MOCK_PLANES_VENTA.slice(startIndex, endIndex);
  const totalPages = Math.ceil(MOCK_PLANES_VENTA.length / params.limit);

  // Mock response matching backend contract
  return {
    data: paginatedData,
    total: MOCK_PLANES_VENTA.length,
    page: params.page,
    limit: params.limit,
    totalPages: totalPages,
  };
};

/**
 * Create a new plan de venta
 * 
 * @param planVenta - Plan de venta data without id
 * @returns Created plan de venta with id
 * 
 * Backend Contract Example:
 * 
 * POST /api/planes-venta
 * Content-Type: application/json
 * 
 * Request Body:
 * {
 *   "identificador": "PV-2025-Q2",
 *   "nombre": "Plan Q2 2025",
 *   "descripcion": "Plan de ventas para el segundo trimestre 2025",
 *   "periodo": "Q2 2025",
 *   "meta": 250,
 *   "vendedorId": "1"
 * }
 * 
 * Response:
 * {
 *   "id": "8",
 *   "identificador": "PV-2025-Q2",
 *   "nombre": "Plan Q2 2025",
 *   "descripcion": "Plan de ventas para el segundo trimestre 2025",
 *   "periodo": "Q2 2025",
 *   "meta": 250,
 *   "vendedorId": "1",
 *   "vendedorNombre": "Carlos Mendoza",  // Populated from vendedor
 *   "unidadesVendidas": 0                 // Initialized to 0
 * }
 * 
 * Validation Rules:
 * - identificador: required, string
 * - nombre: required, min 2 characters
 * - descripcion: required
 * - periodo: required, string
 * - meta: required, number > 0
 * - vendedorId: required, must exist in vendedores table
 * 
 * Business Rules:
 * - A vendedor can have multiple plans (historical)
 * - Only one plan per vendedor can be active per period
 * - unidadesVendidas is calculated from sales data
 * - vendedorNombre is populated from vendedor relation
 * 
 * TODO: Replace with real API call when backend is ready
 * Example implementation:
 * ```typescript
 * export const createPlanVenta = async (planVenta: Omit<PlanVenta, 'id' | 'vendedorNombre' | 'unidadesVendidas'>): Promise<PlanVenta> => {
 *   return apiClient.post<PlanVenta>('/planes-venta', planVenta);
 * };
 * ```
 */
export const createPlanVenta = async (
  planVenta: Omit<PlanVenta, "id" | "vendedorNombre" | "unidadesVendidas">
): Promise<PlanVenta> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Mock response - Add to mock data for immediate visibility
  const newPlanVenta: PlanVenta = {
    id: String(Date.now()),
    ...planVenta,
    vendedorNombre: "Vendedor Mock", // In real app, backend populates this
    unidadesVendidas: 0, // Initialized to 0
  };
  
  // Add to mock data array (in real app, backend handles this)
  MOCK_PLANES_VENTA.push(newPlanVenta);
  
  return newPlanVenta;
};

/**
 * Update an existing plan de venta
 * 
 * @param id - Plan de venta ID
 * @param planVenta - Partial plan de venta data to update
 * @returns Updated plan de venta
 * 
 * Backend Contract Example:
 * 
 * PUT /api/planes-venta/:id
 * Content-Type: application/json
 * 
 * Request Body:
 * {
 *   "nombre": "Plan Q2 2025 - Actualizado",
 *   "meta": 300
 * }
 * 
 * Response:
 * {
 *   "id": "8",
 *   "identificador": "PV-2025-Q2",
 *   "nombre": "Plan Q2 2025 - Actualizado",
 *   "descripcion": "Plan de ventas para el segundo trimestre 2025",
 *   "periodo": "Q2 2025",
 *   "meta": 300,
 *   "vendedorId": "1",
 *   "vendedorNombre": "Carlos Mendoza",
 *   "unidadesVendidas": 150
 * }
 * 
 * Note: vendedorId cannot be changed after creation
 * 
 * TODO: Replace with real API call when backend is ready
 * Example implementation:
 * ```typescript
 * export const updatePlanVenta = async (id: string, planVenta: Partial<Omit<PlanVenta, 'id' | 'vendedorId' | 'vendedorNombre' | 'unidadesVendidas'>>): Promise<PlanVenta> => {
 *   return apiClient.put<PlanVenta>(`/planes-venta/${id}`, planVenta);
 * };
 * ```
 */
export const updatePlanVenta = async (
  id: string,
  planVenta: Partial<Omit<PlanVenta, "id" | "vendedorId" | "vendedorNombre" | "unidadesVendidas">>
): Promise<PlanVenta> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const existing = MOCK_PLANES_VENTA.find((p) => p.id === id);
  if (!existing) {
    throw new Error("Plan de venta not found");
  }

  return {
    ...existing,
    ...planVenta,
  };
};

/**
 * Delete a plan de venta
 * 
 * @param id - Plan de venta ID
 * 
 * Backend Contract Example:
 * 
 * DELETE /api/planes-venta/:id
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Plan de venta eliminado exitosamente"
 * }
 * 
 * TODO: Replace with real API call when backend is ready
 * Example implementation:
 * ```typescript
 * export const deletePlanVenta = async (id: string): Promise<void> => {
 *   return apiClient.delete(`/planes-venta/${id}`);
 * };
 * ```
 */
export const deletePlanVenta = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const index = MOCK_PLANES_VENTA.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error("Plan de venta not found");
  }

  // In mock, we don't actually delete
  console.log(`Plan de venta ${id} would be deleted`);
};
