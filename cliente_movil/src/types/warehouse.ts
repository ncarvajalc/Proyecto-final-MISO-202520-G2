export interface Warehouse {
  id: string;
  nombre: string;
  ubicacion: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItem {
  warehouse: Warehouse;
  stock_quantity: number;
  available_quantity: number;
}

export interface ProductInventory {
  product_id: string;
  total_stock: number;
  warehouses: InventoryItem[];
}

// Backend response from old system
export interface BackendProductInventory {
  id: string;
  warehouse_id: string;
  product_id: string;
  batch_number: string;
  quantity: number;
  storage_type: string;
  zona: string | null;
  capacity: number | null;
  expiration_date: string | null;
  created_at: string;
  updated_at: string;
  warehouse?: Warehouse;
}
