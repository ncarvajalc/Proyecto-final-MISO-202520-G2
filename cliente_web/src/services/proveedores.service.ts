/**
 * Proveedores Service
 * 
 * Handles all API calls related to Proveedores (Suppliers/Providers).
 * Currently using mock data - replace with real API calls when backend is ready.
 * 
 * The apiClient automatically includes JWT token in all requests.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { apiClient } from "@/lib/api-client";
import type { Proveedor, ProveedoresResponse, PaginationParams } from "@/types/proveedor";

/**
 * Mock data for testing
 * TODO: Remove when backend is ready
 */
const MOCK_PROVEEDORES: Proveedor[] = [
  {
    id: "1",
    nombre: "Farmacéutica Global S.A.",
    idTax: "900123456-1",
    direccion: "Calle 123 #45-67, Bogotá",
    telefono: "+57 1 234 5678",
    correo: "contacto@farmglobal.com",
    contacto: "Juan Pérez",
    estado: "Activo",
  },
  {
    id: "2",
    nombre: "Distribuidora MediSupply Ltda.",
    idTax: "800234567-2",
    direccion: "Carrera 45 #12-34, Medellín",
    telefono: "+57 4 345 6789",
    correo: "ventas@medisupply.com",
    contacto: "María García",
    estado: "Activo",
  },
  {
    id: "3",
    nombre: "Importadora Salud Total",
    idTax: "700345678-3",
    direccion: "Avenida 68 #23-45, Cali",
    telefono: "+57 2 456 7890",
    correo: "info@saludtotal.com",
    contacto: "Carlos Rodríguez",
    estado: "Inactivo",
  },
  {
    id: "4",
    nombre: "Laboratorios Unidos S.A.S.",
    idTax: "600456789-4",
    direccion: "Calle 50 #34-56, Barranquilla",
    telefono: "+57 5 567 8901",
    correo: "contacto@labunidos.com",
    contacto: "Ana Martínez",
    estado: "Activo",
  },
  {
    id: "5",
    nombre: "Medicamentos del Caribe",
    idTax: "500567890-5",
    direccion: "Carrera 23 #45-67, Cartagena",
    telefono: "+57 5 678 9012",
    correo: "ventas@medicaribe.com",
    contacto: "Luis González",
    estado: "Activo",
  },
  {
    id: "6",
    nombre: "Droguería Nacional",
    idTax: "400678901-6",
    direccion: "Calle 72 #10-20, Bucaramanga",
    telefono: "+57 7 789 0123",
    correo: "info@droganacional.com",
    contacto: "Patricia López",
    estado: "Inactivo",
  },
  {
    id: "7",
    nombre: "Suministros Médicos del Valle",
    idTax: "300789012-7",
    direccion: "Avenida 3N #12-34, Cali",
    telefono: "+57 2 890 1234",
    correo: "contacto@sumivalle.com",
    contacto: "Roberto Díaz",
    estado: "Activo",
  },
];

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
 *       "id": "1",
 *       "nombre": "Farmacéutica Global S.A.",
 *       "idTax": "900123456-1",
 *       "direccion": "Calle 123 #45-67, Bogotá",
 *       "telefono": "+57 1 234 5678",
 *       "correo": "contacto@farmglobal.com",
 *       "contacto": "Juan Pérez",
 *       "estado": "Activo"
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
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simulate server-side pagination
  const startIndex = (params.page - 1) * params.limit;
  const endIndex = startIndex + params.limit;
  const paginatedData = MOCK_PROVEEDORES.slice(startIndex, endIndex);
  const totalPages = Math.ceil(MOCK_PROVEEDORES.length / params.limit);

  // Mock response matching backend contract
  return {
    data: paginatedData,
    total: MOCK_PROVEEDORES.length,
    page: params.page,
    limit: params.limit,
    totalPages: totalPages,
  };
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
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Mock response - Add to mock data for immediate visibility
  const newProveedor = {
    id: String(Date.now()),
    ...proveedor,
  };
  
  // Add to mock data array (in real app, backend handles this)
  MOCK_PROVEEDORES.push(newProveedor);
  
  return newProveedor;
};

/**
 * Update an existing proveedor
 * 
 * TODO: Replace with real API call when backend is ready
 * Example:
 * ```
 * export const updateProveedor = async (id: string, proveedor: Partial<Proveedor>): Promise<Proveedor> => {
 *   return apiClient.put<Proveedor>(`/proveedores/${id}`, proveedor);
 * };
 * ```
 */
export const updateProveedor = async (
  id: string,
  proveedor: Partial<Proveedor>
): Promise<Proveedor> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const existing = MOCK_PROVEEDORES.find((p) => p.id === id);
  if (!existing) {
    throw new Error("Proveedor not found");
  }

  return {
    ...existing,
    ...proveedor,
  };
};

/**
 * Delete a proveedor
 * 
 * TODO: Replace with real API call when backend is ready
 * Example:
 * ```
 * export const deleteProveedor = async (id: string): Promise<void> => {
 *   return apiClient.delete(`/proveedores/${id}`);
 * };
 * ```
 */
export const deleteProveedor = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const index = MOCK_PROVEEDORES.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error("Proveedor not found");
  }

  // In mock, we don't actually delete
  console.log(`Proveedor ${id} would be deleted`);
};

/**
 * Bulk upload proveedores from CSV file
 * 
 * @param file - CSV file with proveedores data
 * @returns Response with count of created proveedores
 * 
 * Backend Contract Example:
 * 
 * POST /api/proveedores/bulk-upload
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
 * nombre,idTax,direccion,telefono,correo,contacto,estado,certificadoNombre,certificadoCuerpo,certificadoFechaCertificacion,certificadoFechaVencimiento,certificadoUrl
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
): Promise<{ success: boolean; created: number; message: string }> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock validation - check if file is CSV
  if (!file.name.endsWith(".csv")) {
    throw new Error("Solo se permiten archivos CSV");
  }

  // Mock parsing CSV and creating proveedores
  // In real implementation, backend would parse and create
  const mockCreatedCount = Math.floor(Math.random() * 10) + 5; // Random 5-15

  return {
    success: true,
    created: mockCreatedCount,
    message: `${mockCreatedCount} proveedores creados exitosamente`,
  };
};

