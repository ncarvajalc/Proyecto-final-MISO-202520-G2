/**
 * Vendedores Service
 *
 * Handles all API calls related to Vendedores (Salespeople).
 * Integrated with SalesForce backend API.
 *
 * The apiClient automatically includes JWT token in all requests.
 */

import { ApiClient } from "@/lib/api-client";
import type {
  Vendedor,
  VendedoresResponse,
  PaginationParams,
} from "@/types/vendedor";

/**
 * Backend API response types
 * The backend uses different field names than the frontend
 */
interface BackendSalesperson {
  id: string;
  full_name: string;
  email: string;
  hire_date: string; // ISO date string
  status: string;
  created_at: string;
  updated_at: string;
}

interface BackendSalespersonPaginated {
  data: BackendSalesperson[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * Transform backend salesperson data to frontend Vendedor format
 */
const mapBackendToFrontend = (backend: BackendSalesperson): Vendedor => ({
  id: backend.id,
  nombre: backend.full_name,
  correo: backend.email,
  fechaContratacion: backend.hire_date,
  planDeVenta: null, // TODO: Integrate with sales plans API when available
});

/**
 * Transform frontend Vendedor data to backend format for creation
 */
const mapFrontendToBackendCreate = (
  vendedor: Omit<Vendedor, "fechaContratacion" | "planDeVenta">
) => ({
  full_name: vendedor.nombre,
  email: vendedor.correo,
  hire_date: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
  status: "active", // Default status
});

/**
 * Transform frontend Vendedor data to backend format for update
 */
const mapFrontendToBackendUpdate = (
  vendedor: Partial<Omit<Vendedor, "id" | "fechaContratacion">>
) => {
  const update: Partial<{ full_name: string; email: string; status: string }> =
    {};

  if (vendedor.nombre !== undefined) {
    update.full_name = vendedor.nombre;
  }
  if (vendedor.correo !== undefined) {
    update.email = vendedor.correo;
  }

  return update;
};

/**
 * Fetch vendedores with pagination
 *
 * @param params - Pagination parameters (page and limit)
 * @returns Paginated list of vendedores
 *
 * Backend Contract:
 *
 * GET /vendedores?page=1&limit=10
 *
 * Response:
 * {
 *   "data": [
 *     {
 *       "id": "123",
 *       "full_name": "Carlos Mendoza",
 *       "email": "carlos.mendoza@medisupply.com",
 *       "hire_date": "2023-01-15",
 *       "status": "active",
 *       "created_at": "2023-01-15T00:00:00Z",
 *       "updated_at": "2023-01-15T00:00:00Z"
 *     }
 *   ],
 *   "total": 100,
 *   "page": 1,
 *   "limit": 10,
 *   "total_pages": 10
 * }
 */
export const getVendedores = async (
  params: PaginationParams
): Promise<VendedoresResponse> => {
  const apiClient = new ApiClient(import.meta.env.VITE_SALESFORCE_API_URL);

  const response = await apiClient.get<BackendSalespersonPaginated>(
    "/vendedores/",
    {
      params: {
        page: params.page,
        limit: params.limit,
      },
    }
  );

  // Transform backend response to frontend format
  return {
    data: response.data.map(mapBackendToFrontend),
    total: response.total,
    page: response.page,
    limit: response.limit,
    totalPages: response.total_pages,
  };
};

/**
 * Create a new vendedor
 *
 * @param vendedor - Vendedor data without fechaContratacion (auto-assigned by backend)
 * @returns Created vendedor with fechaContratacion
 *
 * Backend Contract:
 *
 * POST /vendedores
 * Content-Type: application/json
 *
 * Request Body:
 * {
 *   "full_name": "Carlos Mendoza",
 *   "email": "carlos.mendoza@medisupply.com",
 *   "hire_date": "2024-10-09",
 *   "status": "active"
 * }
 *
 * Response:
 * {
 *   "id": "generated-uuid",
 *   "full_name": "Carlos Mendoza",
 *   "email": "carlos.mendoza@medisupply.com",
 *   "hire_date": "2024-10-09",
 *   "status": "active",
 *   "created_at": "2024-10-09T15:30:00Z",
 *   "updated_at": "2024-10-09T15:30:00Z"
 * }
 */
export const createVendedor = async (
  vendedor: Omit<Vendedor, "fechaContratacion" | "planDeVenta">
): Promise<Vendedor> => {
  const apiClient = new ApiClient(import.meta.env.VITE_SALESFORCE_API_URL);

  const backendData = mapFrontendToBackendCreate(vendedor);
  const response = await apiClient.post<BackendSalesperson>(
    "/vendedores",
    backendData
  );

  return mapBackendToFrontend(response);
};

/**
 * Update an existing vendedor
 *
 * @param id - Vendedor ID
 * @param vendedor - Partial vendedor data to update
 * @returns Updated vendedor
 *
 * Backend Contract:
 *
 * PUT /vendedores/:id
 * Content-Type: application/json
 *
 * Request Body:
 * {
 *   "full_name": "Carlos Alberto Mendoza",
 *   "email": "carlos.mendoza@medisupply.com"
 * }
 *
 * Response:
 * {
 *   "id": "123",
 *   "full_name": "Carlos Alberto Mendoza",
 *   "email": "carlos.mendoza@medisupply.com",
 *   "hire_date": "2023-01-15",
 *   "status": "active",
 *   "created_at": "2023-01-15T00:00:00Z",
 *   "updated_at": "2024-10-09T15:30:00Z"
 * }
 *
 * Note: hire_date cannot be modified after creation
 */
export const updateVendedor = async (
  id: string,
  vendedor: Partial<Omit<Vendedor, "id" | "fechaContratacion">>
): Promise<Vendedor> => {
  const apiClient = new ApiClient(import.meta.env.VITE_SALESFORCE_API_URL);

  const backendData = mapFrontendToBackendUpdate(vendedor);
  const response = await apiClient.put<BackendSalesperson>(
    `/vendedores/${id}`,
    backendData
  );

  return mapBackendToFrontend(response);
};

/**
 * Delete a vendedor
 *
 * @param id - Vendedor ID
 *
 * Backend Contract:
 *
 * DELETE /vendedores/:id
 *
 * Response:
 * {
 *   "id": "123",
 *   "full_name": "Carlos Mendoza",
 *   "email": "carlos.mendoza@medisupply.com",
 *   "hire_date": "2023-01-15",
 *   "status": "active",
 *   "created_at": "2023-01-15T00:00:00Z",
 *   "updated_at": "2024-10-09T15:30:00Z"
 * }
 */
export const deleteVendedor = async (id: string): Promise<void> => {
  const apiClient = new ApiClient(import.meta.env.VITE_SALESFORCE_API_URL);

  await apiClient.delete(`/vendedores/${id}`);
};
