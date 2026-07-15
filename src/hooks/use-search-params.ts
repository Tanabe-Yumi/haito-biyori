import { useQueryStates } from "nuqs";

import { stockListParams, stockListUrlKeys } from "@/lib/stockListParams";

// 一覧ページのクエリパラメータを型付きで読み書きするフック
// - 論理名 (search, market, ...) で扱い、URL 上は短縮キー (q, m, ...) になる
// - 値はパーサーにより型付き (search: string, market: number[], page: number, ...)
// - デフォルト値と同じ値は URL から取り除かれる
export function useStockListParams() {
  return useQueryStates(stockListParams, { urlKeys: stockListUrlKeys });
}
