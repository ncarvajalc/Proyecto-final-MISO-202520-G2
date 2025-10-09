/**
 * Vendedores Service
 * 
 * Handles all API calls related to Vendedores (Salespeople).
 * Currently using mock data - replace with real API calls when backend is ready.
 * 
 * The apiClient automatically includes JWT token in all requests.
 */

// import { apiClient } from "@/lib/api-client";
import type { Vendedor, VendedoresResponse, PaginationParams } from "@/types/vendedor";

/**
 * Mock data for testing
 * TODO: Remove when backend is ready
 */
const MOCK_VENDEDORES: Vendedor[] = [
  {
    id: "1",
    nombre: "Carlos Mendoza",
    correo: "carlos.mendoza@medisupply.com",
    fechaContratacion: "2023-01-15T00:00:00Z",
    planDeVenta: {
      identificador: "PV-2025-Q1",
      nombre: "Plan Q1 2025",
      descripcion: "Plan de ventas para el primer trimestre 2025",
      periodo: "Q1 2025",
      meta: 200,
      unidadesVendidas: 100,
    },
  },
  {
    id: "2",
    nombre: "Ana Patricia López",
    correo: "ana.lopez@medisupply.com",
    fechaContratacion: "2023-03-20T00:00:00Z",
    planDeVenta: {
      identificador: "PV-2025-Q1",
      nombre: "Plan Q1 2025",
      descripcion: "Plan de ventas para el primer trimestre 2025",
      periodo: "Q1 2025",
      meta: 250,
      unidadesVendidas: 200,
    },
  },
  {
    id: "3",
    nombre: "Roberto Díaz",
    correo: "roberto.diaz@medisupply.com",
    fechaContratacion: "2023-05-10T00:00:00Z",
    planDeVenta: {
      identificador: "PV-2025-Q1",
      nombre: "Plan Q1 2025",
      descripcion: "Plan de ventas para el primer trimestre 2025",
      periodo: "Q1 2025",
      meta: 180,
      unidadesVendidas: 150,
    },
  },
  {
    id: "4",
    nombre: "María Fernanda García",
    correo: "maria.garcia@medisupply.com",
    fechaContratacion: "2023-07-01T00:00:00Z",
    planDeVenta: {
      identificador: "PV-2025-Q1",
      nombre: "Plan Q1 2025",
      descripcion: "Plan de ventas para el primer trimestre 2025",
      periodo: "Q1 2025",
      meta: 220,
      unidadesVendidas: 180,
    },
  },
  {
    id: "5",
    nombre: "Luis Alberto Ramírez",
    correo: "luis.ramirez@medisupply.com",
    fechaContratacion: "2023-08-15T00:00:00Z",
    planDeVenta: {
      identificador: "PV-2025-Q1",
      nombre: "Plan Q1 2025",
      descripcion: "Plan de ventas para el primer trimestre 2025",
      periodo: "Q1 2025",
      meta: 300,
      unidadesVendidas: 250,
    },
  },
  {
    id: "6",
    nombre: "Sandra Milena Torres",
    correo: "sandra.torres@medisupply.com",
    fechaContratacion: "2023-09-22T00:00:00Z",
    planDeVenta: null, // Sin plan asignado
  },
  {
    id: "7",
    nombre: "Jorge Enrique Castro",
    correo: "jorge.castro@medisupply.com",
    fechaContratacion: "2023-10-05T00:00:00Z",
    planDeVenta: {
      identificador: "PV-2025-Q1",
      nombre: "Plan Q1 2025",
      descripcion: "Plan de ventas para el primer trimestre 2025",
      periodo: "Q1 2025",
      meta: 190,
      unidadesVendidas: 120,
    },
  },
];

/**
 * Fetch vendedores with pagination
 * 
 * @param params - Pagination parameters (page and limit)
 * @returns Paginated list of vendedores
 * 
 * Backend Contract Example:
 * 
 * GET /api/vendedores?page=1&limit=5
 * 
 * Response:
 * {
 *   "data": [
 *     {
 *       "id": "1",
 *       "nombre": "Carlos Mendoza",
 *       "correo": "carlos.mendoza@medisupply.com",
 *       "fechaContratacion": "2023-01-15T00:00:00Z"
 *     },
 *     // ... more items
 *   ],
 *   "total": 100,        // Total number of records in database
 *   "page": 1,           // Current page
 *   "limit": 5,          // Items per page
 *   "totalPages": 20     // Total pages (calculated as Math.ceil(total / limit))
 * }
 * 
 * TODO: Replace with real API call when backend is ready
 * Example implementation:
 * ```typescript
 * export const getVendedores = async (params: PaginationParams): Promise<VendedoresResponse> => {
 *   return apiClient.get<VendedoresResponse>('/vendedores', {
 *     params: {
 *       page: params.page,
 *       limit: params.limit
 *     }
 *   });
 * };
 * ```
 */
export const getVendedores = async (params: PaginationParams): Promise<VendedoresResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simulate server-side pagination
  const startIndex = (params.page - 1) * params.limit;
  const endIndex = startIndex + params.limit;
  const paginatedData = MOCK_VENDEDORES.slice(startIndex, endIndex);
  const totalPages = Math.ceil(MOCK_VENDEDORES.length / params.limit);

  // Mock response matching backend contract
  return {
    data: paginatedData,
    total: MOCK_VENDEDORES.length,
    page: params.page,
    limit: params.limit,
    totalPages: totalPages,
  };
};

/**
 * Create a new vendedor
 * 
 * @param vendedor - Vendedor data with id, without fechaContratacion (auto-assigned by backend)
 * @returns Created vendedor with fechaContratacion
 * 
 * Backend Contract Example:
 * 
 * POST /api/vendedores
 * Content-Type: application/json
 * 
 * Request Body:
 * {
 *   "id": "VND-001",
 *   "nombre": "Carlos Mendoza",
 *   "correo": "carlos.mendoza@medisupply.com"
 * }
 * 
 * Response:
 * {
 *   "id": "VND-001",
 *   "nombre": "Carlos Mendoza",
 *   "correo": "carlos.mendoza@medisupply.com",
 *   "fechaContratacion": "2024-10-09T15:30:00Z"  // Auto-assigned to current date/time
 * }
 * 
 * Validation Rules:
 * - id: required, unique
 * - nombre: required, min 2 characters
 * - correo: required, valid email format
 * - fechaContratacion: auto-assigned by backend to current date/time
 * 
 * TODO: Replace with real API call when backend is ready
 * Example implementation:
 * ```typescript
 * export const createVendedor = async (vendedor: Omit<Vendedor, 'fechaContratacion'>): Promise<Vendedor> => {
 *   return apiClient.post<Vendedor>('/vendedores', vendedor);
 * };
 * ```
 */
export const createVendedor = async (
  vendedor: Omit<Vendedor, "fechaContratacion" | "planDeVenta">
): Promise<Vendedor> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Mock response - Add to mock data for immediate visibility
  const newVendedor: Vendedor = {
    ...vendedor,
    fechaContratacion: new Date().toISOString(), // Auto-assigned
    planDeVenta: null, // No plan assigned initially
  };
  
  // Add to mock data array (in real app, backend handles this)
  MOCK_VENDEDORES.push(newVendedor);
  
  return newVendedor;
};

/**
 * Update an existing vendedor
 * 
 * @param id - Vendedor ID
 * @param vendedor - Partial vendedor data to update
 * @returns Updated vendedor
 * 
 * Backend Contract Example:
 * 
 * PUT /api/vendedores/:id
 * Content-Type: application/json
 * 
 * Request Body:
 * {
 *   "nombre": "Carlos Alberto Mendoza",
 *   "correo": "carlos.mendoza@medisupply.com"
 * }
 * 
 * Response:
 * {
 *   "id": "123",
 *   "nombre": "Carlos Alberto Mendoza",
 *   "correo": "carlos.mendoza@medisupply.com",
 *   "fechaContratacion": "2023-01-15T00:00:00Z"  // Unchanged
 * }
 * 
 * Note: fechaContratacion cannot be modified after creation
 * 
 * TODO: Replace with real API call when backend is ready
 * Example implementation:
 * ```typescript
 * export const updateVendedor = async (id: string, vendedor: Partial<Omit<Vendedor, 'id' | 'fechaContratacion'>>): Promise<Vendedor> => {
 *   return apiClient.put<Vendedor>(`/vendedores/${id}`, vendedor);
 * };
 * ```
 */
export const updateVendedor = async (
  id: string,
  vendedor: Partial<Omit<Vendedor, "id" | "fechaContratacion">>
): Promise<Vendedor> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const existing = MOCK_VENDEDORES.find((v) => v.id === id);
  if (!existing) {
    throw new Error("Vendedor not found");
  }

  return {
    ...existing,
    ...vendedor,
  };
};

/**
 * Delete a vendedor
 * 
 * @param id - Vendedor ID
 * 
 * Backend Contract Example:
 * 
 * DELETE /api/vendedores/:id
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Vendedor eliminado exitosamente"
 * }
 * 
 * TODO: Replace with real API call when backend is ready
 * Example implementation:
 * ```typescript
 * export const deleteVendedor = async (id: string): Promise<void> => {
 *   return apiClient.delete(`/vendedores/${id}`);
 * };
 * ```
 */
export const deleteVendedor = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const index = MOCK_VENDEDORES.findIndex((v) => v.id === id);
  if (index === -1) {
    throw new Error("Vendedor not found");
  }

  // In mock, we don't actually delete
  console.log(`Vendedor ${id} would be deleted`);
};

