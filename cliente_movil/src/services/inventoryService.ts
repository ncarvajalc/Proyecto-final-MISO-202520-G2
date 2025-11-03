import axios from 'axios';
import { ProductInventory, BackendProductInventory } from '../types/warehouse';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

export const inventoryService = {
  /**
   * Get inventory information for a specific product from backend API
   * Transforms old system response to expected format
   */
  async getProductInventory(productSku: string): Promise<ProductInventory> {
    try {
      const response = await axios.get<BackendProductInventory[]>(
        `${API_URL}/inventario/producto/${productSku}`
      );

      const inventoryList = response.data;

      // Transform old system response to expected format
      const warehouseMap = new Map<string, BackendProductInventory>();

      // Group by warehouse_id and sum quantities
      inventoryList.forEach(item => {
        if (warehouseMap.has(item.warehouse_id)) {
          const existing = warehouseMap.get(item.warehouse_id)!;
          existing.quantity += item.quantity;
        } else {
          warehouseMap.set(item.warehouse_id, {...item});
        }
      });

      // Calculate total stock
      const total_stock = inventoryList.reduce((sum, item) => sum + item.quantity, 0);

      // Build warehouses array
      const warehouses = Array.from(warehouseMap.values()).map(item => ({
        warehouse: item.warehouse || {
          id: item.warehouse_id,
          nombre: item.warehouse_id,
          ubicacion: ''
        },
        stock_quantity: item.quantity,
        available_quantity: item.quantity
      }));

      return {
        product_id: productSku,
        total_stock,
        warehouses
      };
    } catch (error) {
      console.error(`Error fetching inventory for product ${productSku}:`, error);
      throw error;
    }
  }
};
