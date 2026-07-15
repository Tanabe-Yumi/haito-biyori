import { parseAsString, useQueryState } from "nuqs";

import {
  StockListParamName,
  stockListUrlKeys,
} from "@/lib/stockListParams";

// TODO: 初期値を引数から設定

// TODO: パーサーの設定 (https://nuqs.dev/docs/parsers/built-in#literals)

// 論理名 (search, market, ...) で受け取り、URL 上は短縮キー (q, m, ...) で読み書きする
export function useSearchParam(key: StockListParamName) {
  return useQueryState(
    stockListUrlKeys[key],
    parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  );
}
