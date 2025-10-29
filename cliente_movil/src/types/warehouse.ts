export interface Warehouse {
  id: number;
  name: string;
  location: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItem {
  warehouse: Warehouse;
  stock_quantity: number;
  available_quantity: number;
}

export interface ProductInventory {
  product_id: number;
  total_stock: number;
  warehouses: InventoryItem[];
}
