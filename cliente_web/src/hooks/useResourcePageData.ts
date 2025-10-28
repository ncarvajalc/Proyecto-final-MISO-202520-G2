import { usePaginatedResource } from "@/hooks/usePaginatedResource";
import { useResourcePageLayoutConfig } from "@/hooks/useResourcePageLayoutConfig";

interface UseResourcePageDataOptions<T> {
  resourceKey: string;
  fetcher: (params: { page: number; limit: number }) => Promise<{
    data: T[];
    totalPages?: number;
    total?: number;
    page?: number;
    limit?: number;
  }>;
  itemsPerPage: number;
}

export const useResourcePageData = <T,>({
  resourceKey,
  fetcher,
  itemsPerPage,
}: UseResourcePageDataOptions<T>) => {
  const resource = usePaginatedResource<T>(resourceKey, fetcher, itemsPerPage);

  const layoutConfig = useResourcePageLayoutConfig({
    isLoading: resource.isLoading,
    isError: !!resource.isError,
    currentPage: resource.currentPage,
    totalPages: resource.totalPages,
    onPageChange: resource.setCurrentPage,
  });

  return { ...resource, layoutConfig };
};
