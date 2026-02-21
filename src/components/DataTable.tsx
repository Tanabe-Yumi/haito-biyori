"use client";

import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  currentPage = 0,
  totalPages = 1,
  onPageChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    // サーバーサイドページネーションの場合はgetPaginationRowModelを使用しない
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    // ページネーションを手動モードに設定
    manualPagination: onPageChange !== undefined,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination: {
        pageIndex: currentPage,
        pageSize: data.length,
      },
    },
  });

  // TODO: 全体から検索できるように修正

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        {/* 検索窓 */}
        <InputGroup className="max-w-xs">
          <InputGroupInput
            placeholder="銘柄名やコードで検索..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <button
              onClick={() => setGlobalFilter("")}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="検索をクリア"
              title="検索をクリア"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </InputGroupAddon>
        </InputGroup>

        {/* TODO: 表示する行数選択のドロップダウンを追加 */}
      </div>

      {/* テーブル */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  データが見つかりません。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground text-sm">
          {onPageChange ? (
            <>
              ページ {currentPage + 1} / {totalPages}
            </>
          ) : (
            <>
              {table.getFilteredRowModel().rows.length} 件中{" "}
              {table.getFilteredSelectedRowModel().rows.length} を選択中
            </>
          )}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onPageChange) {
                onPageChange(currentPage - 1);
              } else {
                table.previousPage();
              }
            }}
            disabled={
              onPageChange ? currentPage === 0 : !table.getCanPreviousPage()
            }
          >
            前へ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onPageChange) {
                onPageChange(currentPage + 1);
              } else {
                table.nextPage();
              }
            }}
            disabled={
              onPageChange
                ? currentPage >= totalPages - 1
                : !table.getCanNextPage()
            }
          >
            次へ
          </Button>
        </div>
      </div>
    </div>
  );
}
