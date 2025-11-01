import axios from 'axios';
import { ProductInventory } from '../types/warehouse';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

export const inventoryService = {
  /**
   * Get inventory information for a specific product from backend API
   */
  async getProductInventory(productId: number): Promise<ProductInventory> {
    try {
      const response = await axios.get<ProductInventory>(
        `${API_URL}/inventario/producto/${productId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching inventory for product ${productId}:`, error);
      throw error;
    }
  }
};
