/**
 * Proveedores Service
 * 
 * Handles all API calls related to Proveedores (Suppliers/Providers).
 * Currently using mock data - replace with real API calls when backend is ready.
 * 
 * The apiClient automatically includes JWT token in all requests.
 */


import { ApiClient } from "@/lib/api-client";
import type {
  BulkUploadResponse,
  Proveedor,
  ProveedoresResponse,
  PaginationParams,
} from "@/types/proveedor";

/**
 * Fetch proveedores with pagination
 * 
 * @param params - Pagination parameters (page and limit)
 * @returns Paginated list of proveedores
 * 
 * Backend Contract Example:
 * 
 * GET /api/proveedores?page=1&limit=5
 * 
 * Response:
 * {
 *   "data": [
 *     {
 *       "id": 1,
 *       "nombre": "Farmacéutica Global S.A.",
 *       "id_tax": "900123456-1",
 *       "direccion": "Calle 123 #45-67, Bogotá",
 *       "telefono": "+57 1 234 5678",
 *       "correo": "contacto@farmglobal.com",
 *       "contacto": "Juan Pérez",
 *       "estado": "Activo",
 *       "certificado": null
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
 * export const getProveedores = async (params: PaginationParams): Promise<ProveedoresResponse> => {
 *   return apiClient.get<ProveedoresResponse>('/proveedores', {
 *     params: {
 *       page: params.page,
 *       limit: params.limit
 *     }
 *   });
 * };
 * ```
 */
export const getProveedores = async (params: PaginationParams): Promise<ProveedoresResponse> => {
  // Simulate API delay
  const apiClient = new ApiClient(import.meta.env.VITE_PROVEEDORES_API_URL);
  const response = await apiClient.get<ProveedoresResponse | Proveedor[]>('/proveedores', {
    params: {
      page: params.page,
      limit: params.limit
    }
  });

  const createPaginatedResponse = (data: Proveedor[], page: number, limit: number) => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return data.slice(startIndex, endIndex);
  };
  
  if (Array.isArray(response)) {
    return {
      data: createPaginatedResponse(response, params.page, params.limit),
      total: response.length,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(response.length / params.limit)
    };
  }

  return response;
};

/**
 * Create a new proveedor
 * 
 * TODO: Replace with real API call when backend is ready
 * Example:
 * ```
 * export const createProveedor = async (proveedor: Omit<Proveedor, 'id'>): Promise<Proveedor> => {
 *   return apiClient.post<Proveedor>('/proveedores', proveedor);
 * };
 * ```
 */
export const createProveedor = async (
  proveedor: Omit<Proveedor, "id">
): Promise<Proveedor> => {
  const apiClient = new ApiClient(import.meta.env.VITE_PROVEEDORES_API_URL);
  const response = await apiClient.post<Proveedor>('/proveedores', proveedor);
  console.log(response);
  return response;
};

/**
 * Bulk upload proveedores from CSV file
 * 
 * @param file - CSV file with proveedores data
 * @returns Response with count of created proveedores
 * 
 * Backend Contract Example:
 * 
 * POST /proveedores/bulk-upload
 * Content-Type: multipart/form-data
 * 
 * Request Body:
 * - file: CSV file
 * 
 * Response:
 * {
 *   "success": true,
 *   "created": 15,
 *   "message": "15 proveedores creados exitosamente"
 * }
 * 
 * CSV Format:
 * nombre,id_tax,direccion,telefono,correo,contacto,estado,certificadoNombre,certificadoCuerpo,certificadoFechaCertificacion,certificadoFechaVencimiento,certificadoUrl
 * 
 * TODO: Replace with real API call when backend is ready
 * Example:
 * ```
 * export const bulkUploadProveedores = async (file: File): Promise<{ success: boolean; created: number; message: string }> => {
 *   const formData = new FormData();
 *   formData.append('file', file);
 *   return apiClient.post('/proveedores/bulk-upload', formData, {
 *     headers: {
 *       'Content-Type': 'multipart/form-data',
 *     },
 *   });
 * };
 * ```
 */
export const bulkUploadProveedores = async (
  file: File
): Promise<BulkUploadResponse> => {
  const apiClient = new ApiClient(import.meta.env.VITE_PROVEEDORES_API_URL);
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.post<BulkUploadResponse>(
    "/proveedores/bulk-upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

