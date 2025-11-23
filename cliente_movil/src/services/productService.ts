import axios from "axios";
import { getApiBaseUrl } from "../config/api";
import { Product, ProductPaginated } from "../types/product";

const buildUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl();
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
};

console.log("[PRODUCT SERVICE v2] Using API URL:", getApiBaseUrl());
console.log(
  "[PRODUCT SERVICE v2] This is the NEW bundle - timestamp:",
  new Date().toISOString()
);

export const productService = {
  /**
   * Get paginated list of products
   */
  async getProducts(
    page: number = 1,
    limit: number = 10
  ): Promise<ProductPaginated> {
    try {
      const fullUrl = buildUrl("/productos/");
      console.log("[PRODUCT SERVICE v2] Making request to:", fullUrl);
      console.log("[PRODUCT SERVICE v2] With params:", { page, limit });

      const response = await axios.get<ProductPaginated>(fullUrl, {
        params: { page, limit },
      });

      console.log("[PRODUCT SERVICE v2] Response received successfully");
      return response.data;
    } catch (error: any) {
      console.error("[PRODUCT SERVICE v2] Error fetching products:", error);
      console.error("[PRODUCT SERVICE v2] Error config:", error.config);
      console.error("[PRODUCT SERVICE v2] Error response:", error.response);
      console.error("[PRODUCT SERVICE v2] Error message:", error.message);
      if (error.config) {
        console.error(
          "[PRODUCT SERVICE v2] Request URL was:",
          error.config.url
        );
        console.error(
          "[PRODUCT SERVICE v2] Request baseURL was:",
          error.config.baseURL
        );
      }
      throw error;
    }
  },

    /**
     * Get a single product by ID
     */
    async getProductById(id: number): Promise<Product> {
      try {
        const response = await axios.get<Product>(buildUrl(`/productos/${id}`));
        return response.data;
      } catch (error) {
        console.error(`Error fetching product ${id}:`, error);
        throw error;
      }
  },
};
