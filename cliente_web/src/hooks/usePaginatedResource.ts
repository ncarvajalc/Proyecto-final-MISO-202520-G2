import { useState } from "react";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

interface PaginationParams {
  page: number;
  limit: number;
}

interface PaginatedResponse<T> {
  data: T[];
  totalPages?: number;
  total?: number;
  page?: number;
  limit?: number;
}

type Fetcher<T> = (params: PaginationParams) => Promise<PaginatedResponse<T>>;

export const usePaginatedResource = <T,>(
  queryKey: string,
  fetcher: Fetcher<T>,
  itemsPerPage: number
) => {
  const [currentPage, setCurrentPage] = useState(1);

  const queryResult = useQuery<PaginatedResponse<T>>({
    queryKey: [queryKey, currentPage, itemsPerPage],
    queryFn: () => fetcher({ page: currentPage, limit: itemsPerPage }),
    placeholderData: keepPreviousData,
  });

  const totalPages = queryResult.data?.totalPages ?? 0;

  return {
    ...queryResult,
    currentPage,
    setCurrentPage,
    totalPages,
  };
};

