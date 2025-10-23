/**
 * Logística Service
 *
 * Handles all API calls related to Logística (Logistics).
 * Includes vehicle management functionality.
 *
 * All requests go through the API Gateway.
 */

import type {
  VehiculosResponse,
  PaginationParams,
  LogisticaProducto,
  Bodega,
  ProductWarehouseLocation,
  ProductAvailability,
} from "@/types/logistica";
import { getApiBaseUrl } from "@/config/api";

/**
 * Backend response type for vehicles endpoint
 */
interface BackendVehiculo {
  id: string;
  placa: string;
  conductor: string;
  numeroEntregas: number;
}

interface BackendVehiculosResponse {
  data: BackendVehiculo[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface BackendLogisticaProducto {
  sku: string;
  nombre?: string;
  descripcion?: string;
  name?: string;
  description?: string;
}

interface BackendBodega {
  id?: string | number;
  codigo?: string | number;
  nombre?: string;
  name?: string;
  descripcion?: string;
  description?: string;
}

interface BackendProductosResponse {
  data?: BackendLogisticaProducto[];
}

interface BackendBodegasResponse {
  data?: BackendBodega[];
}

interface BackendProductLocationResponse {
  location?: string;
  posicion?: string;
  position?: string;
  zona?: string;
  zone?: string;
  message?: string;
  detail?: string;
}

interface BackendProductAvailabilityResponse {
  warehouse?: BackendBodega & { id?: string | number };
  bodega?: BackendBodega & { id?: string | number };
  location?: BackendBodega & { id?: string | number };
  availableIn?: BackendBodega & { id?: string | number };
  message?: string;
  detail?: string;
}

/**
 * Fetch vehículos with pagination
 *
 * @param params - Pagination parameters (page and limit)
 * @returns Paginated list of vehículos
 *
 * Backend Contract:
 *
 * GET /vehiculos?page={page}&limit={limit}
 *
 * Query Parameters:
 * - page: number (required) - Page number (1-based)
 * - limit: number (required) - Items per page
 *
 * Response: 200 OK
 * Content-Type: application/json
 *
 * Response Body:
 * {
 *   "data": [
 *     {
 *       "id": "string",
 *       "placa": "string",
 *       "conductor": "string",
 *       "numeroEntregas": number
 *     }
 *   ],
 *   "total": number,
 *   "page": number,
 *   "limit": number,
 *   "total_pages": number
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid pagination parameters
 * - 500 Internal Server Error: Server error
 */
export const getVehiculos = async (
  params: PaginationParams
): Promise<VehiculosResponse> => {
  const { page, limit } = params;
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/vehiculos?page=${page}&limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const responseData: BackendVehiculosResponse = await response.json();

  // Map backend response to frontend types
  // Backend uses snake_case (total_pages), frontend uses camelCase (totalPages)
  return {
    data: responseData.data.map((vehiculo) => ({
      id: String(vehiculo.id), // Ensure ID is string
      placa: vehiculo.placa,
      conductor: vehiculo.conductor,
      numeroEntregas: vehiculo.numeroEntregas,
    })),
    total: responseData.total,
    page: responseData.page,
    limit: responseData.limit,
    totalPages: responseData.total_pages,
  };
};

const DEFAULT_PRODUCT_NOT_FOUND_MESSAGE =
  "Producto no localizado en esta bodega";
const DEFAULT_PRODUCT_UNAVAILABLE_MESSAGE =
  "Producto sin disponibilidad en bodega";

const readJsonSafely = async <T>(response: Response): Promise<T | Record<string, unknown>> => {
  try {
    return (await response.json()) as T;
  } catch (error) {
    console.warn("No se pudo parsear la respuesta JSON de logística:", error);
    return {};
  }
};

const ensureArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (value && typeof value === "object" && "data" in (value as Record<string, unknown>)) {
    const data = (value as { data?: unknown }).data;
    return Array.isArray(data) ? (data as T[]) : [];
  }
  return [];
};

const normalizeProducto = (producto: BackendLogisticaProducto): LogisticaProducto => {
  const nombre =
    producto.nombre ??
    producto.name ??
    producto.descripcion ??
    producto.description ??
    producto.sku;

  return {
    sku: producto.sku,
    nombre,
    descripcion: producto.descripcion ?? producto.description,
  };
};

const normalizeBodega = (bodega: BackendBodega): Bodega => {
  const codigo =
    bodega.codigo ??
    bodega.id ??
    (bodega.nombre ? bodega.nombre.replace(/\s+/g, "-").toLowerCase() : undefined);

  const rawId =
    bodega.id ??
    bodega.codigo ??
    codigo ??
    globalThis.crypto?.randomUUID?.() ??
    `bodega-${Math.random().toString(36).slice(2, 10)}`;

  return {
    id: String(rawId),
    nombre: bodega.nombre ?? bodega.name ?? bodega.descripcion ?? "Bodega",
    codigo: codigo ? String(codigo) : undefined,
  };
};

const normalizeLocation = (data: BackendProductLocationResponse): ProductWarehouseLocation => {
  const location =
    data.location ??
    data.posicion ??
    data.position ??
    data.zona ??
    data.zone ??
    null;

  if (location) {
    return { location: String(location) };
  }

  return {
    location: null,
    message: data.message ?? data.detail ?? DEFAULT_PRODUCT_NOT_FOUND_MESSAGE,
  };
};

const normalizeAvailability = (
  data: BackendProductAvailabilityResponse
): ProductAvailability => {
  const warehouse =
    data.warehouse ??
    data.bodega ??
    data.location ??
    data.availableIn ??
    null;

  if (!warehouse) {
    return {
      warehouseId: null,
      warehouseName: null,
      message: data.message ?? data.detail ?? DEFAULT_PRODUCT_UNAVAILABLE_MESSAGE,
    };
  }

  const warehouseId =
    warehouse.id ??
    warehouse.codigo ??
    (warehouse.nombre
      ? warehouse.nombre.replace(/\s+/g, "-").toLowerCase()
      : undefined);

  return {
    warehouseId: warehouseId ? String(warehouseId) : null,
    warehouseName:
      warehouse.nombre ??
      warehouse.name ??
      warehouse.descripcion ??
      warehouse.description ??
      null,
    message: undefined,
  };
};

export const getProductosInventario = async (): Promise<LogisticaProducto[]> => {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/logistica/productos`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const responseData = (await readJsonSafely<BackendProductosResponse>(
    response
  )) as BackendProductosResponse | BackendLogisticaProducto[];

  return ensureArray<BackendLogisticaProducto>(responseData).map(normalizeProducto);
};

export const getBodegas = async (): Promise<Bodega[]> => {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/logistica/bodegas`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const responseData = (await readJsonSafely<BackendBodegasResponse>(
    response
  )) as BackendBodegasResponse | BackendBodega[];

  return ensureArray<BackendBodega>(responseData).map(normalizeBodega);
};

export const localizarProductoEnBodega = async ({
  sku,
  warehouseId,
}: {
  sku: string;
  warehouseId: string;
}): Promise<ProductWarehouseLocation> => {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(
    `${baseUrl}/logistica/bodegas/${encodeURIComponent(warehouseId)}/productos/${encodeURIComponent(sku)}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (response.status === 404) {
    const errorData = (await readJsonSafely<BackendProductLocationResponse>(
      response
    )) as BackendProductLocationResponse;
    return {
      location: null,
      message:
        errorData.message ?? errorData.detail ?? DEFAULT_PRODUCT_NOT_FOUND_MESSAGE,
    };
  }

  if (!response.ok) {
    const errorData = (await readJsonSafely<BackendProductLocationResponse>(
      response
    )) as BackendProductLocationResponse;
    throw new Error(
      errorData.message ??
        errorData.detail ??
        "No se pudo localizar el producto en la bodega seleccionada"
    );
  }

  const data = (await readJsonSafely<BackendProductLocationResponse>(
    response
  )) as BackendProductLocationResponse;
  return normalizeLocation(data);
};

export const consultarDisponibilidadProducto = async (
  sku: string
): Promise<ProductAvailability> => {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(
    `${baseUrl}/logistica/productos/${encodeURIComponent(sku)}/disponibilidad`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (response.status === 404) {
    const errorData = (await readJsonSafely<BackendProductAvailabilityResponse>(
      response
    )) as BackendProductAvailabilityResponse;
    return {
      warehouseId: null,
      warehouseName: null,
      message:
        errorData.message ??
        errorData.detail ??
        DEFAULT_PRODUCT_UNAVAILABLE_MESSAGE,
    };
  }

  if (!response.ok) {
    const errorData = (await readJsonSafely<BackendProductAvailabilityResponse>(
      response
    )) as BackendProductAvailabilityResponse;
    throw new Error(
      errorData.message ??
        errorData.detail ??
        "No se pudo consultar la disponibilidad del producto"
    );
  }

  const data = (await readJsonSafely<BackendProductAvailabilityResponse>(
    response
  )) as BackendProductAvailabilityResponse;
  return normalizeAvailability(data);
};
