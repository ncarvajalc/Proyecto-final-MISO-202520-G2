/**
 * Informes Comerciales Service
 *
 * Handles all API calls related to Informes Comerciales (Commercial Reports) against the
 * SalesForce backend. The ApiClient automatically includes the JWT token in
 * every request so the service can focus on translating between the backend
 * contract and the shape expected by the UI.
 */

import { getApiBaseUrl } from "@/config/api";
import { ApiClient } from "@/lib/api-client";
import { buildPaginationMeta } from "@/lib/pagination";
import type {
  InformeComercial,
  InformesComercialResponse,
  PaginationParams,
} from "@/types/informeComercial";

/**
 * Fetch informes comerciales with pagination
 *
 * @param params - Pagination parameters (page and limit)
 * @returns Paginated list of informes comerciales
 *
 * Backend Contract:
 * GET /api/informes-comerciales?page=1&limit=5
 *
 * Notes:
 * - fecha is in ISO 8601 format (UTC timezone)
 * - ventasTotales is the sum of all sales values in the report period
 * - unidadesVendidas is the sum of all units sold in the report period
 * - Both indicators are calculated from the sales data when the report is created
 */
type BackendInformeComercial = {
  id: string;
  nombre: string;
  fecha: string;
  ventasTotales?: number;
  ventas_totales?: number;
  unidadesVendidas?: number;
  unidades_vendidas?: number;
};

type BackendPaginatedResponse = {
  data: BackendInformeComercial[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  total_pages?: number;
};

export const getInformesComerciales = async (
  params: PaginationParams
): Promise<InformesComercialResponse> => {
  const apiClient = new ApiClient(getApiBaseUrl());
  const response = await apiClient.get<BackendPaginatedResponse>(
    "/informes-comerciales/",
    {
      params: {
        page: params.page,
        limit: params.limit,
      },
    }
  );

  const normalizedData: InformeComercial[] = response.data.map((informe) => ({
    id: informe.id,
    nombre: informe.nombre,
    fecha: informe.fecha,
    ventasTotales: informe.ventasTotales ?? informe.ventas_totales ?? 0,
    unidadesVendidas:
      informe.unidadesVendidas ?? informe.unidades_vendidas ?? 0,
  }));

  const pagination = buildPaginationMeta(response, params.limit);

  return {
    data: normalizedData,
    ...pagination,
  };
};

/**
 * Create a new informe comercial
 *
 * @param informeComercial - Informe comercial data without id
 * @returns Created informe comercial with calculated indicators
 *
 * Backend Contract:
 * POST /api/informes-comerciales
 *
 * Business Rules:
 * - fecha is automatically set to the current timestamp when the report is created
 * - ventasTotales and unidadesVendidas are calculated from all sales data
 * - The calculation includes all sales data available at the time of report creation
 */
export const createInformeComercial = async (
  informeComercial: Omit<
    InformeComercial,
    "id" | "fecha" | "ventasTotales" | "unidadesVendidas"
  >
): Promise<InformeComercial> => {
  const apiClient = new ApiClient(getApiBaseUrl());
  const response = await apiClient.post<BackendInformeComercial>(
    "/informes-comerciales/",
    {
      nombre: informeComercial.nombre,
    }
  );

  return {
    id: response.id,
    nombre: response.nombre,
    fecha: response.fecha,
    ventasTotales: response.ventasTotales ?? response.ventas_totales ?? 0,
    unidadesVendidas:
      response.unidadesVendidas ?? response.unidades_vendidas ?? 0,
  };
};
