import axios from 'axios';
import { ProductInventory, BackendProductInventory, Warehouse } from '../types/warehouse';

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

      // Get unique warehouse IDs
      const warehouseIds = [...new Set(inventoryList.map(item => item.warehouse_id))];

      // Fetch warehouse information
      const warehousesResponse = await axios.get<Warehouse[]>(`${API_URL}/bodegas`);
      const warehousesMap = new Map<string, Warehouse>();
      warehousesResponse.data.forEach(warehouse => {
        warehousesMap.set(warehouse.id, warehouse);
      });

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

      // Build warehouses array with complete warehouse information
      const warehouses = Array.from(warehouseMap.values()).map(item => {
        const warehouse = warehousesMap.get(item.warehouse_id);
        return {
          warehouse: warehouse || {
            id: item.warehouse_id,
            nombre: 'Bodega desconocida',
            ubicacion: 'Ubicación no disponible'
          },
          stock_quantity: item.quantity,
          available_quantity: item.quantity
        };
      });

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
