import axios from 'axios';
import { ProductInventory } from '../types/warehouse';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

interface InventorySummary {
  product_id: string;
  total_quantity: number;
  warehouses_count: number;
  storage_types: string[];
}

export const inventoryService = {
  /**
   * Get inventory information for a specific product from backend API
   */
  async getProductInventory(productSku: string): Promise<ProductInventory> {
    try {
      // Use the product_inventory endpoint with SKU
      const summaryResponse = await axios.get<InventorySummary>(
        `${API_URL}/inventario/producto/${productSku}/resumen`
      );
      const summary = summaryResponse.data;

      // Get warehouse details if there's inventory
      const warehouses = [];
      if (summary.warehouses_count > 0) {
        try {
          const inventoryResponse = await axios.get(
            `${API_URL}/inventario/?limit=100`
          );
          const allInventory = inventoryResponse.data.data || [];

          // Filter inventory for this product and get unique warehouses
          const productInventory = allInventory.filter(
            (item: any) => item.product_id === productSku
          );

          const warehouseMap = new Map();
          for (const item of productInventory) {
            if (!warehouseMap.has(item.warehouse_id)) {
              // Get warehouse details
              try {
                const warehouseResponse = await axios.get(
                  `${API_URL}/bodegas/${item.warehouse_id}`
                );
                const warehouse = warehouseResponse.data;
                warehouseMap.set(item.warehouse_id, {
                  warehouse: {
                    id: 0, // Not used
                    name: warehouse.nombre || '',
                    location: warehouse.ubicacion || '',
                    active: true
                  },
                  stock_quantity: 0,
                  available_quantity: 0
                });
              } catch (err) {
                console.warn(`Failed to fetch warehouse ${item.warehouse_id}`, err);
              }
            }

            if (warehouseMap.has(item.warehouse_id)) {
              const entry = warehouseMap.get(item.warehouse_id);
              entry.stock_quantity += item.quantity || 0;
              entry.available_quantity += item.quantity || 0;
            }
          }

          warehouses.push(...Array.from(warehouseMap.values()));
        } catch (err) {
          console.warn('Failed to fetch detailed warehouse info', err);
        }
      }

      return {
        product_id: 0, // Not used
        total_stock: summary.total_quantity,
        warehouses: warehouses
      };
    } catch (error) {
      console.error(`Error fetching inventory for product ${productSku}:`, error);
      // Return empty inventory instead of throwing
      return {
        product_id: 0,
        total_stock: 0,
        warehouses: []
      };
    }
  }
};
