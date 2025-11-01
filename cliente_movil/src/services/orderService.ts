import axios from "axios";
import { Order, OrderCreate, OrdersResponse } from "../types/order";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

console.log("[ORDER SERVICE] Using API URL:", API_URL);

export const orderService = {
  /**
   * Get paginated list of orders
   */
  async getOrders(
    page: number = 1,
    limit: number = 20,
    institutional_client_id?: string
  ): Promise<OrdersResponse> {
    try {
      const fullUrl = `${API_URL}/pedidos`;
      console.log("[ORDER SERVICE] Making request to:", fullUrl);
      console.log("[ORDER SERVICE] With params:", {
        page,
        limit,
        institutional_client_id,
      });

      const response = await axios.get<OrdersResponse>(fullUrl, {
        params: {
          page,
          limit,
          ...(institutional_client_id && { institutional_client_id }),
        },
      });

      console.log("[ORDER SERVICE] Response received successfully");
      return response.data;
    } catch (error: any) {
      console.error("[ORDER SERVICE] Error fetching orders:", error);
      console.error("[ORDER SERVICE] Error response:", error.response);
      console.error("[ORDER SERVICE] Error message:", error.message);
      throw error;
    }
  },

  /**
   * Get a single order by ID
   */
  async getOrderById(id: number): Promise<Order> {
    try {
      const fullUrl = `${API_URL}/pedidos/${id}`;
      console.log("[ORDER SERVICE] Fetching order:", fullUrl);

      const response = await axios.get<Order>(fullUrl);
      console.log("[ORDER SERVICE] Order fetched successfully");
      return response.data;
    } catch (error: any) {
      console.error(`[ORDER SERVICE] Error fetching order ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new order
   */
  async createOrder(orderData: OrderCreate): Promise<Order> {
    try {
      const fullUrl = `${API_URL}/pedidos`;
      console.log("[ORDER SERVICE] Creating order at:", fullUrl);
      console.log("[ORDER SERVICE] Order data:", JSON.stringify(orderData, null, 2));

      const response = await axios.post<Order>(fullUrl, orderData);
      console.log("[ORDER SERVICE] Order created successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[ORDER SERVICE] Error creating order:", error);
      console.error("[ORDER SERVICE] Error response:", error.response?.data);
      console.error("[ORDER SERVICE] Error status:", error.response?.status);
      throw error;
    }
  },
};
