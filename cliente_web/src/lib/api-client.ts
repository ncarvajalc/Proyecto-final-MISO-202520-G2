/**
 * API Client with Axios
 *
 * Centralized API client that automatically includes JWT token in all requests.
 * Works seamlessly with TanStack Query.
 *
 * Features:
 * - Automatic JWT token injection
 * - Request/Response interceptors
 * - Automatic JSON parsing
 * - Better error handling
 * - TypeScript support
 *
 * Usage with TanStack Query:
 * ```
 * const { data } = useQuery({
 *   queryKey: ['providers'],
 *   queryFn: () => apiClient.get('/providers')
 * });
 * ```
 */

import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { getAuthToken, removeAuthToken } from "./auth";

export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 seconds
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - Add JWT token to every request
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle common errors
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Handle 401 Unauthorized - token expired or invalid
        if (error.response?.status === 401) {
          removeAuthToken();
          window.location.href = "/login";
        }

        // Handle other errors and surface backend details when present
        const detail =
          error.response?.data?.detail || error.response?.data?.message;
        const message = detail || error.message || "An error occurred";

        const enhancedError = new Error(message) as Error & { detail?: string };
        if (detail) {
          enhancedError.detail = detail;
        }

        return Promise.reject(enhancedError);
      }
    );
  }

  private async request<T>(
    method: "get" | "post" | "put" | "patch" | "delete",
    endpoint: string,
    options?: {
      data?: unknown;
      config?: AxiosRequestConfig;
    }
  ): Promise<T> {
    const { data, config } = options ?? {};
    const response: AxiosResponse<T> = await this.axiosInstance.request({
      url: endpoint,
      method,
      data,
      ...(config ?? {}),
    });
    return response.data;
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request("get", endpoint, { config });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request("post", endpoint, { data, config });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request("put", endpoint, { data, config });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request("patch", endpoint, { data, config });
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request("delete", endpoint, { config });
  }

  /**
   * Get the underlying Axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}
