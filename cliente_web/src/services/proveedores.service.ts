/**
 * Proveedores Service
 * 
 * Handles all API calls related to Proveedores (Suppliers/Providers).
 * Currently using mock data - replace with real API calls when backend is ready.
 * 
 * The apiClient automatically includes JWT token in all requests.
 */

import { apiClient } from "@/lib/api-client";
import type { Proveedor, ProveedoresResponse } from "@/types/proveedor";

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
 * Fetch all proveedores
 * 
 * TODO: Replace with real API call when backend is ready
 * Example:
 * ```
 * export const getProveedores = async (): Promise<ProveedoresResponse> => {
 *   return apiClient.get<ProveedoresResponse>('/proveedores');
 * };
 * ```
 */
export const getProveedores = async (): Promise<ProveedoresResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock response
  return {
    data: MOCK_PROVEEDORES,
    total: MOCK_PROVEEDORES.length,
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
  
  // Mock response
  return {
    id: String(Date.now()),
    ...proveedor,
  };
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

