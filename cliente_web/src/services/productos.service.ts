/**
 * Productos Service
 *
 * Handles all API calls related to Productos (Products).
 * Connected to real backend API.
 *
 * The apiClient automatically includes JWT token in all requests.
 */

import type {
  Producto,
  ProductosResponse,
  PaginationParams,
  BulkUploadProductsResponse,
} from "@/types/producto";
import { ApiClient } from "@/lib/api-client";
import { getApiBaseUrl } from "@/config/api";

/**
 * Fetch productos with pagination
 *
 * @param params - Pagination parameters (page and limit)
 * @returns Paginated list of productos
 */
export const getProductos = async (params: PaginationParams): Promise<ProductosResponse> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/productos/?page=${params.page}&limit=${params.limit}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const responseData: {
    data: Array<Omit<Producto, "id"> & { id: number | string }>;
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  } = await response.json();

  // Convert id to string for frontend compatibility
  const data: Producto[] = responseData.data.map((producto) => ({
    ...producto,
    id: String(producto.id),
  }));

  return {
    data,
    total: responseData.total,
    page: responseData.page,
    limit: responseData.limit,
    totalPages: responseData.total_pages,
  };
};

/**
 * Create a new producto
 *
 * @param producto - Producto data without id
 * @returns Created producto with id
 */
export const createProducto = async (
  producto: Omit<Producto, "id">
): Promise<Producto> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/productos/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(producto),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const responseData: Omit<Producto, "id"> & { id: number | string } =
    await response.json();

  // Convert id to string for frontend compatibility
  return {
    ...responseData,
    id: String(responseData.id),
  };
};

/**
 * Update an existing producto
 *
 * TODO: Replace with real API call when backend is ready
 * Example:
 * ```
 * export const updateProducto = async (id: string, producto: Partial<Producto>): Promise<Producto> => {
 *   return apiClient.put<Producto>(`/productos/${id}`, producto);
 * };
 * ```
 */
export const updateProducto = async (
  id: string,
  producto: Partial<Producto>
): Promise<Producto> => {
  void id;
  void producto;
  throw new Error("updateProducto not implemented - backend endpoint pending");
};

/**
 * Delete a producto
 *
 * TODO: Replace with real API call when backend is ready
 * Example:
 * ```
 * export const deleteProducto = async (id: string): Promise<void> => {
 *   return apiClient.delete(`/productos/${id}`);
 * };
 * ```
 */
export const deleteProducto = async (id: string): Promise<void> => {
  void id;
  throw new Error("deleteProducto not implemented - backend endpoint pending");
};

/**
 * Bulk upload productos from CSV file
 *
 * @param file - CSV file with productos data
 * @returns Response with count of created productos
 *
 * Backend Contract Example:
 *
 * POST /api/productos/bulk-upload
 * Content-Type: multipart/form-data
 *
 * Request Body:
 * - file: CSV file
 *
 * Response:
 * {
 *   "success": true,
 *   "created": 15,
 *   "message": "15 productos creados exitosamente"
 * }
 *
 * CSV Format:
 * sku,nombre,descripcion,precio,especificaciones,urlManual,urlHojaInstalacion,certificaciones
 *
 * Notes:
 * - especificaciones: JSON string like '[{"nombre":"Presentación","valor":"Caja x 20"}]'
 * - certificaciones: Comma-separated values like 'INVIMA,FDA,ISO 9001'
 *
 * TODO: Replace with real API call when backend is ready
 * Example:
 * ```
 * export const bulkUploadProductos = async (file: File): Promise<{ success: boolean; created: number; message: string }> => {
 *   const formData = new FormData();
 *   formData.append('file', file);
 *   return apiClient.post('/productos/bulk-upload', formData, {
 *     headers: {
 *       'Content-Type': 'multipart/form-data',
 *     },
 *   });
 * };
 * ```
 */
export const bulkUploadProductos = async (
  file: File
): Promise<BulkUploadProductsResponse> => {
  const apiClient = new ApiClient(getApiBaseUrl());
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.post<BulkUploadProductsResponse>(
    "/productos/bulk-upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

