import { buildPaginationMeta } from "@/lib/pagination";

interface PaginatedResponseLike {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  total_pages?: number;
}

export const toPaginatedResult = <TData, TResponse extends PaginatedResponseLike>(
  response: TResponse,
  limit: number,
  data: TData[]
) => ({
  data,
  ...buildPaginationMeta(response, limit),
});
