/**
 * Warehouse Service
 *
 * Handles all API calls related to Warehouse (Bodega) operations.
 * Currently uses mock data for product location functionality.
 *
 * All requests go through the API Gateway.
 */

import type {
  ProductLocation,
  ProductLocationRequest,
  Bodega,
  ProductWarehouseLocationRequest,
  ProductWarehouseLocation,
} from "@/types/warehouse";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getApiBaseUrl } from "@/config/api";

/**
 * Get product location in warehouse
 *
 * @param request - Object containing SKU
 * @returns Product location information
 *
 * Backend Contract for Backend Team:
 *
 * GET /productos/localizacion?sku={sku}
 *
 * Query Parameters:
 * - sku: string (required) - Product SKU to locate
 *
 * Response: 200 OK
 * Content-Type: application/json
 *
 * Response Body:
 * {
 *   "sku": "string",
 *   "bodega": "string",
 *   "zona": "string",
 *   "encontrado": boolean
 * }
 *
 * Example Success Response (Product Found):
 * ```json
 * {
 *   "sku": "MED-12345",
 *   "bodega": "Bogotá-1",
 *   "zona": "Z4-2",
 *   "encontrado": true
 * }
 * ```
 *
 * Example Response (Product Not Found):
 * ```json
 * {
 *   "sku": "MED-UNKNOWN",
 *   "bodega": "",
 *   "zona": "",
 *   "encontrado": false
 * }
 * ```
 *
 * Error Responses:
 * - 400 Bad Request: Missing or invalid SKU parameter
 * - 404 Not Found: Product not found in any warehouse
 * - 500 Internal Server Error: Server error
 *
 * Notes for Backend Team:
 * - The endpoint should search across all warehouses and return the first location where the product is found
 * - If the product is found in multiple warehouses, return the primary/main warehouse location
 * - The zona field should contain the exact location code (e.g., "Z4-2" for Zone 4, Position 2)
 * - If encontrado=false, both bodega and zona fields should be empty strings
 *
 * TODO: Replace with real API call when backend is ready
 * Example:
 * ```
 * export const getProductLocation = async (
 *   request: ProductLocationRequest
 * ): Promise<ProductLocation> => {
 *   const { sku } = request;
 *   const baseUrl = getApiBaseUrl();
 *   const url = `${baseUrl}/productos/localizacion?sku=${encodeURIComponent(sku)}`;
 *
 *   const response = await fetch(url, {
 *     headers: {
 *       'Content-Type': 'application/json',
 *     },
 *   });
 *
 *   if (!response.ok) {
 *     if (response.status === 404) {
 *       throw new Error('Producto no encontrado');
 *     }
 *     throw new Error(`HTTP error! status: ${response.status}`);
 *   }
 *
 *   return response.json();
 * };
 * ```
 */
export const getProductLocation = async (
  request: ProductLocationRequest
): Promise<ProductLocation> => {
  const { sku } = request;

  // MOCK DATA - Simulating API call with random success/failure
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate different scenarios based on SKU
      const hash = sku
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const isFound = hash % 3 !== 0; // ~66% chance of finding the product

      const bodegas = ["Bogotá-1", "Medellín-1", "Cali-1", "Barranquilla-1"];
      const zones = ["Z1-3", "Z2-5", "Z3-1", "Z4-2", "Z5-8", "Z6-4"];

      if (isFound) {
        // Select a random bodega and zone based on SKU hash
        const selectedBodega = bodegas[hash % bodegas.length];
        const selectedZone = zones[hash % zones.length];

        resolve({
          sku,
          bodega: selectedBodega,
          zona: selectedZone,
          encontrado: true,
        });
      } else {
        resolve({
          sku,
          bodega: "",
          zona: "",
          encontrado: false,
        });
      }
    }, 800);
  });
};

/**
 * Get list of available warehouses (bodegas)
 *
 * @returns List of available warehouses
 *
 * Backend Contract for Backend Team:
 *
 * GET /bodegas
 * Response: 200 OK
 * Content-Type: application/json
 *
 * Response Body:
 * [
 *   {
 *     "id": "string",
 *     "nombre": "string",
 *     "ubicacion": "string" // optional
 *   }
 * ]
 *
 * Example Response:
 * ```json
 * [
 *   {
 *     "id": "1",
 *     "nombre": "Bogotá-1",
 *     "ubicacion": "Bogotá"
 *   },
 *   {
 *     "id": "2",
 *     "nombre": "Medellín-1",
 *     "ubicacion": "Medellín"
 *   }
 * ]
 * ```
 *
 * TODO: Replace with real API call when backend is ready
 * Example:
 * ```
 * export const getBodegas = async (): Promise<Bodega[]> => {
 *   const baseUrl = getApiBaseUrl();
 *   const url = `${baseUrl}/bodegas`;
 *
 *   const response = await fetch(url, {
 *     headers: {
 *       'Content-Type': 'application/json',
 *     },
 *   });
 *
 *   if (!response.ok) {
 *     throw new Error(`HTTP error! status: ${response.status}`);
 *   }
 *
 *   return response.json();
 * };
 * ```
 */
export const getBodegas = async (): Promise<Bodega[]> => {
  // MOCK DATA - Replace with real API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: "1", nombre: "Bogotá-1", ubicacion: "Bogotá" },
        { id: "2", nombre: "Medellín-1", ubicacion: "Medellín" },
        { id: "3", nombre: "Cali-1", ubicacion: "Cali" },
        { id: "4", nombre: "Barranquilla-1", ubicacion: "Barranquilla" },
      ]);
    }, 500);
  });
};

/**
 * Get product location in a specific warehouse
 *
 * @param request - Object containing SKU and bodegaId
 * @returns Product location information within the specified warehouse
 *
 * Backend Contract for Backend Team:
 *
 * GET /productos/localizacion-bodega?sku={sku}&bodegaId={bodegaId}
 *
 * Query Parameters:
 * - sku: string (required) - Product SKU to locate
 * - bodegaId: string (required) - Warehouse ID where to search
 *
 * Response: 200 OK
 * Content-Type: application/json
 *
 * Response Body:
 * {
 *   "sku": "string",
 *   "bodega": "string",
 *   "zona": "string",
 *   "encontrado": boolean
 * }
 *
 * Example Success Response (Product Found):
 * ```json
 * {
 *   "sku": "MED-12345",
 *   "bodega": "Bogotá-1",
 *   "zona": "Z4-2",
 *   "encontrado": true
 * }
 * ```
 *
 * Example Response (Product Not Found):
 * ```json
 * {
 *   "sku": "MED-12345",
 *   "bodega": "Bogotá-1",
 *   "zona": "",
 *   "encontrado": false
 * }
 * ```
 *
 * Error Responses:
 * - 400 Bad Request: Missing or invalid parameters
 * - 404 Not Found: Warehouse (bodega) not found
 * - 500 Internal Server Error: Server error
 *
 * Notes for Backend Team:
 * - The endpoint should search ONLY in the specified warehouse
 * - The zona field should contain the exact location code (e.g., "Z4-2" for Zone 4, Position 2)
 * - If encontrado=false, the zona field should be empty string
 * - The bodega field should always contain the warehouse name, even if product is not found
 *
 * TODO: Replace with real API call when backend is ready
 * Example:
 * ```
 * export const getProductLocationInWarehouse = async (
 *   request: ProductWarehouseLocationRequest
 * ): Promise<ProductWarehouseLocation> => {
 *   const { sku, bodegaId } = request;
 *   const baseUrl = getApiBaseUrl();
 *   const url = `${baseUrl}/productos/localizacion-bodega?sku=${encodeURIComponent(sku)}&bodegaId=${encodeURIComponent(bodegaId)}`;
 *
 *   const response = await fetch(url, {
 *     headers: {
 *       'Content-Type': 'application/json',
 *     },
 *   });
 *
 *   if (!response.ok) {
 *     if (response.status === 404) {
 *       throw new Error('Bodega no encontrada');
 *     }
 *     throw new Error(`HTTP error! status: ${response.status}`);
 *   }
 *
 *   return response.json();
 * };
 * ```
 */
export const getProductLocationInWarehouse = async (
  request: ProductWarehouseLocationRequest
): Promise<ProductWarehouseLocation> => {
  const { sku, bodegaId } = request;

  // MOCK DATA - Simulating API call with random success/failure
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate different scenarios based on SKU and bodegaId
      const hash = (sku + bodegaId)
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const isFound = hash % 3 !== 0; // ~66% chance of finding the product

      const bodegaNombres: Record<string, string> = {
        "1": "Bogotá-1",
        "2": "Medellín-1",
        "3": "Cali-1",
        "4": "Barranquilla-1",
      };

      const zones = ["Z1-3", "Z2-5", "Z3-1", "Z4-2", "Z5-8", "Z6-4"];
      const bodegaNombre = bodegaNombres[bodegaId] || `Bodega-${bodegaId}`;

      if (isFound) {
        // Select a random zone based on hash
        const selectedZone = zones[hash % zones.length];

        resolve({
          sku,
          bodega: bodegaNombre,
          zona: selectedZone,
          encontrado: true,
        });
      } else {
        resolve({
          sku,
          bodega: bodegaNombre,
          zona: "",
          encontrado: false,
        });
      }
    }, 800);
  });
};
