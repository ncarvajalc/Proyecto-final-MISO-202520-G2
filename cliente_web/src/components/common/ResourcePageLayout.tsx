import type { ReactNode } from "react";

import { PageHeader, PageStateMessage } from "@/components/common/PageLayout";
import {
  PaginatedTable,
  PaginationControls,
  type ColumnDefinition,
} from "@/components/common/PaginatedTable";

interface ResourcePageState {
  isLoading: boolean;
  isError: boolean;
}

interface ResourcePageTableProps<T> {
  columns: ColumnDefinition[];
  data?: T[];
  emptyMessage: string;
  renderRow: (item: T) => ReactNode;
  emptyColSpan?: number;
}

interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface ResourcePageLayoutProps<T> {
  title: string;
  actions?: ReactNode;
  loadingMessage: string;
  errorMessage: string;
  state: ResourcePageState;
  table: ResourcePageTableProps<T>;
  pagination: PaginationConfig;
  children?: ReactNode;
}

export function ResourcePageLayout<T>({
  title,
  actions,
  loadingMessage,
  errorMessage,
  state,
  table,
  pagination,
  children,
}: ResourcePageLayoutProps<T>) {
  if (state.isLoading) {
    return <PageStateMessage message={loadingMessage} />;
  }

  if (state.isError) {
    return (
      <PageStateMessage message={errorMessage} variant="error" />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={title} actions={actions} />

      <PaginatedTable
        columns={table.columns}
        data={table.data}
        emptyMessage={table.emptyMessage}
        renderRow={table.renderRow}
        emptyColSpan={table.emptyColSpan}
      />

      <PaginationControls
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.onPageChange}
      />

      {children}
    </div>
  );
}
