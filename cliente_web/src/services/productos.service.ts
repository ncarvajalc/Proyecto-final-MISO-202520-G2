/**
 * Productos Service
 *
 * Handles all API calls related to Productos (Products).
 * Currently using mock data - replace with real API calls when backend is ready.
 *
 * The apiClient automatically includes JWT token in all requests.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { apiClient } from "@/lib/api-client";
import type { Producto, ProductosResponse } from "@/types/producto";

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
      certificaciones: "INVIMA, FDA",
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
      certificaciones: "INVIMA",
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
      certificaciones: "INVIMA, Certificación pediátrica",
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
 * Fetch all productos
 *
 * TODO: Replace with real API call when backend is ready
 * Example:
 * ```
 * export const getProductos = async (): Promise<ProductosResponse> => {
 *   return apiClient.get<ProductosResponse>('/productos');
 * };
 * ```
 */
export const getProductos = async (): Promise<ProductosResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock response
  return {
    data: MOCK_PRODUCTOS,
    total: MOCK_PRODUCTOS.length,
  };
};

/**
 * Create a new producto
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

  // Mock response
  return {
    id: String(Date.now()),
    ...producto,
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

