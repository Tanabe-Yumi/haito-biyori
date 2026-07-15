import type { RowData } from "@tanstack/react-table";

// TanStack Table の ColumnMeta を拡張
// 列定義の meta.className が th/td に付与される (DataTable.tsx で適用)
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    // th/td に付与するクラス (レスポンシブな列の表示制御などに使う)
    className?: string;
  }
}
