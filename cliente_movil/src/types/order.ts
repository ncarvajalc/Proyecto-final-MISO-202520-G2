export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  total_price: number;
  created_at: string;
}

export interface Order {
  id: number;
  institutional_client_id: string;
  order_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderItemCreate {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface OrderCreate {
  institutional_client_id: string;
  items: OrderItemCreate[];
}

export interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface OrderStatusItem {
  product_id: number;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderStatus {
  id: number;
  order_number: string;
  institutional_client_id: string;
  client_name: string;
  order_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  product_count: number;
  total_units: number;
  items: OrderStatusItem[];
}

export interface ScheduledDelivery {
  order_id: number;
  client_name: string;
  country: string;
  city: string;
  address: string;
}

export interface ScheduledDeliveriesResponse {
  data: ScheduledDelivery[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
