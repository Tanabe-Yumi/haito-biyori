"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  // 表示カラム変更
  // VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SearchBox from "@/components/SearchBox";
import PaginationControll from "@/components/PaginationControll";
import RowsSelector from "@/components/RowsSelector";
import { useSearchParam } from "@/hooks/use-search-params";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  total: number;
  isLoading: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  total,
  isLoading,
}: DataTableProps<TData, TValue>) {
  const [page] = useSearchParam("page");
  const [rows] = useSearchParam("rows");
  const currentPage = parseInt(page) - 1 || 0;
  const currentRows = parseInt(rows) || 10;
  const from = currentPage * currentRows + 1;
  const to = from + data.length - 1;

  // 表示カラム変更
  // const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // ページネーション (手動モード)
    manualPagination: true,
    // 表示カラム変更
    // onColumnVisibilityChange: setColumnVisibility,
    state: {
      // 表示カラム変更
      // rowSelection,
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        {/* 検索窓 */}
        <SearchBox isLoading={isLoading} />

        {/* 表示行数セレクター */}
        <RowsSelector />
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

      <div className="flex items-center justify-between space-x-2">
        {/* 表示範囲 */}
        <div className="text-muted-foreground text-sm">
          {`${from} 〜 ${to} / ${total} 件`}
        </div>

        {/* ページネーション */}
        <PaginationControll total={total} />
      </div>
    </div>
  );
}
