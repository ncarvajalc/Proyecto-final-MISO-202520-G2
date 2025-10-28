import { useMemo } from "react";

interface ResourcePageLayoutParams {
  isLoading: boolean;
  isError: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const useResourcePageLayoutConfig = ({
  isLoading,
  isError,
  currentPage,
  totalPages,
  onPageChange,
}: ResourcePageLayoutParams) =>
  useMemo(
    () => ({
      state: { isLoading, isError },
      pagination: { currentPage, totalPages, onPageChange },
    }),
    [currentPage, isError, isLoading, onPageChange, totalPages]
  );
