interface PaginationSource {
  totalPages?: number;
  total_pages?: number;
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * Resolve the total number of pages from different backend response shapes.
 */
export const resolveTotalPages = (
  source: PaginationSource,
  requestedLimit: number
): number => {
  if (typeof source.totalPages === 'number') {
    return source.totalPages;
  }

  if (typeof source.total_pages === 'number') {
    return source.total_pages;
  }

  if (typeof source.total === 'number' && requestedLimit > 0) {
    return Math.ceil(source.total / requestedLimit);
  }

  return 0;
};

/**
 * Build a normalized pagination metadata object that can be reused across services.
 */
export const buildPaginationMeta = <T extends PaginationSource>(
  source: T,
  requestedLimit: number
) => ({
  total: source.total ?? 0,
  page: source.page ?? 1,
  limit: source.limit ?? requestedLimit,
  totalPages: resolveTotalPages(source, requestedLimit),
});

