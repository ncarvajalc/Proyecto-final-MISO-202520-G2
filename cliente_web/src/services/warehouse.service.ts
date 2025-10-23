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
