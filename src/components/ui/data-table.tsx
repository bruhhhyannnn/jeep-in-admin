'use client';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './table';
import { Spinner } from './spinner';
import { Pagination } from './pagination';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  globalFilter?: string;
  emptyMessage?: string;
  /** One helpful line under the empty message. */
  emptyHint?: string;
  loading?: boolean;
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  isRowSelected?: (row: TData) => boolean;
}

export function DataTable<TData>({
  columns,
  data,
  globalFilter,
  emptyMessage = 'Nothing here yet',
  emptyHint,
  loading = false,
  pageSize,
  onRowClick,
  isRowSelected,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: globalFilter ?? '' },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(pageSize && {
      getPaginationRowModel: getPaginationRowModel(),
      initialState: { pagination: { pageSize, pageIndex: 0 } },
      autoResetPageIndex: true,
    }),
  });

  const paginated = !!pageSize;
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={canSort ? 'hover:text-ink cursor-pointer select-none' : ''}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort &&
                        (sorted === 'asc' ? (
                          <ArrowUp size={12} />
                        ) : sorted === 'desc' ? (
                          <ArrowDown size={12} />
                        ) : (
                          <ArrowUpDown size={12} className="opacity-40" />
                        ))}
                    </span>
                  </TableHead>
                );
              })}
            </tr>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            <tr>
              <TableCell colSpan={columns.length} className="py-16 text-center">
                <Spinner center />
              </TableCell>
            </tr>
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                selected={isRowSelected?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <tr>
              <TableCell colSpan={columns.length} className="py-16 text-center">
                <p className="text-ink text-[15px] font-semibold">{emptyMessage}</p>
                {emptyHint && <p className="text-ink-muted mt-1 text-[13px]">{emptyHint}</p>}
              </TableCell>
            </tr>
          )}
        </TableBody>
      </Table>

      {paginated && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-ink-muted text-[13px]">
            Page <span className="font-data text-ink">{currentPage}</span> of{' '}
            <span className="font-data text-ink">{totalPages}</span>
          </p>
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => table.setPageIndex(p - 1)}
          />
        </div>
      )}
    </div>
  );
}
