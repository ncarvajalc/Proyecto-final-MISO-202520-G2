/**
 * Productos Service
 *
 * Handles all API calls related to Productos (Products).
 * Currently using mock data - replace with real API calls when backend is ready.
 *
 * The apiClient automatically includes JWT token in all requests.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import { apiClient } from "@/lib/api-client";
import type { Producto, ProductosResponse, PaginationParams } from "@/types/producto";

/**
 * Mock data for testing
 * TODO: Remove when backend is ready
 */
const MOCK_PRODUCTOS: Producto[] = [
  {
    id: "1",
    sku: "MED-001",
    nombre: "Paracetamol 500mg",
    descripcion: "Analgésico y antipirético en tabletas",
    precio: 5000,
    activo: true,
    especificaciones: [
      { nombre: "Presentación", valor: "Caja x 20 tabletas" },
      { nombre: "Principio Activo", valor: "Paracetamol" },
      { nombre: "Concentración", valor: "500mg" },
    ],
    hojaTecnica: {
      urlManual: "https://ejemplo.com/manuales/paracetamol.pdf",
      urlHojaInstalacion: "https://ejemplo.com/instalacion/paracetamol.pdf",
      certificaciones: ["INVIMA", "FDA"],
    },
  },
  {
    id: "2",
    sku: "MED-002",
    nombre: "Ibuprofeno 400mg",
    descripcion: "Antiinflamatorio no esteroideo",
    precio: 8500,
    activo: true,
    especificaciones: [
      { nombre: "Presentación", valor: "Caja x 30 tabletas" },
      { nombre: "Principio Activo", valor: "Ibuprofeno" },
      { nombre: "Concentración", valor: "400mg" },
    ],
  },
  {
    id: "3",
    sku: "MED-003",
    nombre: "Amoxicilina 500mg",
    descripcion: "Antibiótico de amplio espectro",
    precio: 15000,
    activo: true,
    especificaciones: [
      { nombre: "Presentación", valor: "Caja x 21 cápsulas" },
      { nombre: "Principio Activo", valor: "Amoxicilina" },
      { nombre: "Concentración", valor: "500mg" },
      { nombre: "Vía de administración", valor: "Oral" },
    ],
    hojaTecnica: {
      urlManual: "https://ejemplo.com/manuales/amoxicilina.pdf",
      certificaciones: ["INVIMA"],
    },
  },
  {
    id: "4",
    sku: "MED-004",
    nombre: "Omeprazol 20mg",
    descripcion: "Inhibidor de la bomba de protones",
    precio: 12000,
    activo: false,
  },
  {
    id: "5",
    sku: "MED-005",
    nombre: "Loratadina 10mg",
    descripcion: "Antihistamínico para alergias",
    precio: 6500,
    activo: true,
    especificaciones: [
      { nombre: "Presentación", valor: "Caja x 10 tabletas" },
      { nombre: "Principio Activo", valor: "Loratadina" },
    ],
  },
  {
    id: "6",
    sku: "MED-006",
    nombre: "Acetaminofén Jarabe",
    descripcion: "Analgésico y antipirético para niños",
    precio: 9800,
    activo: true,
    especificaciones: [
      { nombre: "Presentación", valor: "Frasco x 120ml" },
      { nombre: "Concentración", valor: "100mg/ml" },
      { nombre: "Sabor", valor: "Fresa" },
    ],
    hojaTecnica: {
      urlManual: "https://ejemplo.com/manuales/acetaminofen-jarabe.pdf",
      urlHojaInstalacion: "https://ejemplo.com/instalacion/acetaminofen.pdf",
      certificaciones: ["INVIMA", "OMS"],
    },
  },
  {
    id: "7",
    sku: "MED-007",
    nombre: "Diclofenaco Gel",
    descripcion: "Antiinflamatorio tópico",
    precio: 18500,
    activo: false,
    especificaciones: [
      { nombre: "Presentación", valor: "Tubo x 60g" },
      { nombre: "Concentración", valor: "1%" },
      { nombre: "Vía de administración", valor: "Tópica" },
    ],
  },
];

/**
 * Fetch productos with pagination
 *
 * @param params - Pagination parameters (page and limit)
 * @returns Paginated list of productos
 *
 * Backend Contract Example:
 *
 * GET /api/productos?page=1&limit=5
 *
 * Response:
 * {
 *   "data": [
 *     {
 *       "id": "1",
 *       "sku": "MED-001",
 *       "nombre": "Paracetamol 500mg",
 *       "descripcion": "Analgésico y antipirético",
 *       "precio": 5000,
 *       "activo": true,
 *       "especificaciones": [...],
 *       "hojaTecnica": {...}
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
 * export const getProductos = async (params: PaginationParams): Promise<ProductosResponse> => {
 *   return apiClient.get<ProductosResponse>('/productos', {
 *     params: {
 *       page: params.page,
 *       limit: params.limit
 *     }
 *   });
 * };
 * ```
 */
export const getProductos = async (params: PaginationParams): Promise<ProductosResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simulate server-side pagination
  const startIndex = (params.page - 1) * params.limit;
  const endIndex = startIndex + params.limit;
  const paginatedData = MOCK_PRODUCTOS.slice(startIndex, endIndex);
  const totalPages = Math.ceil(MOCK_PRODUCTOS.length / params.limit);

  // Mock response matching backend contract
  return {
    data: paginatedData,
    total: MOCK_PRODUCTOS.length,
    page: params.page,
    limit: params.limit,
    totalPages: totalPages,
  };
};

/**
 * Create a new producto
 *
 * @param producto - Producto data without id
 * @returns Created producto with id
 *
 * Backend Contract Example:
 *
 * POST /api/productos
 * Content-Type: application/json
 *
 * Request Body:
 * {
 *   "sku": "MED-001",
 *   "nombre": "Paracetamol 500mg",
 *   "descripcion": "Analgésico y antipirético",
 *   "precio": 5000,
 *   "activo": true,
 *   "especificaciones": [
 *     { "nombre": "Presentación", "valor": "Caja x 20" },
 *     { "nombre": "Concentración", "valor": "500mg" }
 *   ],
 *   "hojaTecnica": {
 *     "urlManual": "https://ejemplo.com/manual.pdf",
 *     "urlHojaInstalacion": "https://ejemplo.com/instalacion.pdf",
 *     "certificaciones": ["INVIMA", "FDA", "ISO 9001"]
 *   }
 * }
 *
 * Response:
 * {
 *   "id": "123",
 *   "sku": "MED-001",
 *   "nombre": "Paracetamol 500mg",
 *   "descripcion": "Analgésico y antipirético",
 *   "precio": 5000,
 *   "activo": true,
 *   "especificaciones": [...],
 *   "hojaTecnica": {
 *     "urlManual": "https://ejemplo.com/manual.pdf",
 *     "urlHojaInstalacion": "https://ejemplo.com/instalacion.pdf",
 *     "certificaciones": ["INVIMA", "FDA", "ISO 9001"]
 *   }
 * }
 *
 * TODO: Replace with real API call when backend is ready
 * Example:
 * ```
 * export const createProducto = async (producto: Omit<Producto, 'id'>): Promise<Producto> => {
 *   return apiClient.post<Producto>('/productos', producto);
 * };
 * ```
 */
export const createProducto = async (
  producto: Omit<Producto, "id">
): Promise<Producto> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock response - Add to mock data for immediate visibility
  const newProducto = {
    id: String(Date.now()),
    ...producto,
  };

  // Add to mock data array (in real app, backend handles this)
  MOCK_PRODUCTOS.push(newProducto);

  return newProducto;
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
  await new Promise((resolve) => setTimeout(resolve, 500));

  const existing = MOCK_PRODUCTOS.find((p) => p.id === id);
  if (!existing) {
    throw new Error("Producto not found");
  }

  return {
    ...existing,
    ...producto,
  };
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
  await new Promise((resolve) => setTimeout(resolve, 500));

  const index = MOCK_PRODUCTOS.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error("Producto not found");
  }

  // In mock, we don't actually delete
  console.log(`Producto ${id} would be deleted`);
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
): Promise<{ success: boolean; created: number; message: string }> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock validation - check if file is CSV
  if (!file.name.endsWith(".csv")) {
    throw new Error("Solo se permiten archivos CSV");
  }

  // Mock parsing CSV and creating productos
  // In real implementation, backend would parse and create
  const mockCreatedCount = Math.floor(Math.random() * 10) + 5; // Random 5-15

  return {
    success: true,
    created: mockCreatedCount,
    message: `${mockCreatedCount} productos creados exitosamente`,
  };
};

