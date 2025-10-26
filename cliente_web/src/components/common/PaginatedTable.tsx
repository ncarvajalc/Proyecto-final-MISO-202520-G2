import type { ReactElement, ReactNode } from "react";

import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ColumnDefinition {
  key: string;
  header: ReactNode;
  className?: string;
}

interface PaginatedTableProps<T> {
  columns: ColumnDefinition[];
  data?: T[];
  renderRow: (item: T) => ReactElement;
  emptyMessage: string;
  emptyColSpan?: number;
}

export const PaginatedTable = <T,>({
  columns,
  data,
  renderRow,
  emptyMessage,
  emptyColSpan,
}: PaginatedTableProps<T>) => {
  const colSpan = emptyColSpan ?? columns.length;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key} className={column.className}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {!data || data.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={colSpan}
              className="text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          data.map((item) => renderRow(item))
        )}
      </TableBody>
    </Table>
  );
};

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex justify-end">
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};

