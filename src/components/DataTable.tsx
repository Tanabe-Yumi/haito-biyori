"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  // 表示カラム変更
  // VisibilityState,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SearchBox from "@/components/SearchBox";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isLoading: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  currentPage = 0,
  totalPages = 1,
  onPageChange,
  isLoading,
}: DataTableProps<TData, TValue>) {
  // 表示カラム変更
  // const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // ページネーション (手動モード)
    manualPagination: onPageChange !== undefined,
    pageCount: totalPages,
    // 表示カラム変更
    // onColumnVisibilityChange: setColumnVisibility,
    state: {
      // 表示カラム変更
      // rowSelection,
      // ページネーション (手動モード)
      pagination: {
        pageIndex: currentPage,
        pageSize: data.length,
      },
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        {/* 検索窓 */}
        <SearchBox isLoading={isLoading} />

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
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  読み込み中...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
