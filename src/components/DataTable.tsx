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
import { StockFilterMenu } from "@/components/StockFilterMenu";
import { useStockListParams } from "@/hooks/use-search-params";
import { Market } from "@/types/market";
import { Industry } from "@/types/industry";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  total: number;
  isLoading: boolean;
  markets: Market[];
  industries: Industry[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  total,
  isLoading,
  markets,
  industries,
}: DataTableProps<TData, TValue>) {
  const [{ page, rows }] = useStockListParams();
  // 0 基準のページ番号に直す
  const currentPage = page - 1;
  const from = currentPage * rows + 1;
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
      {/* ツールバー
          絞り込みと件数セレクターは1つのグループとして扱い、収まらないときは
          グループごと検索窓の下に折り返す (件数セレクターだけが2行目に落ちない) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 検索窓 */}
        <SearchBox isLoading={isLoading} />

        <div className="flex flex-1 items-center justify-between gap-2">
          {/* 絞り込みメニュー */}
          <StockFilterMenu markets={markets} industries={industries} />

          {/* 表示行数セレクター */}
          <RowsSelector />
        </div>
      </div>

      {/* テーブル */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={header.column.columnDef.meta?.className}
                    >
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
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.className}
                    >
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

      {/* 狭い幅では表示範囲の下に折り返し、ページネーションを中央に配置する */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* 表示範囲 */}
        <div className="text-muted-foreground text-sm">
          {`${from} 〜 ${to} / ${total} 件`}
        </div>

        {/* ページネーション */}
        <div className="self-center">
          <PaginationControll total={total} />
        </div>
      </div>
    </div>
  );
}
