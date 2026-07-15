import { createLoader, createSerializer, parseAsString } from "nuqs/server";

// 一覧ページのクエリパラメータ定義
// ここでのキーの定義順が、URL に直列化するときの正規の順序になる
export const stockListParams = {
  search: parseAsString.withDefault(""),
  market: parseAsString.withDefault(""),
  industry: parseAsString.withDefault(""),
  yield: parseAsString.withDefault(""),
  score: parseAsString.withDefault(""),
  page: parseAsString.withDefault(""),
  rows: parseAsString.withDefault(""),
};

// クエリを正規の順序で直列化する (デフォルト値 "" のキーは省略される)
// canonical URL や内部リンクの組み立てに使い、同条件のURLを常に同一文字列にする
export const serializeStockListParams = createSerializer(stockListParams);

// searchParams から既知のキーだけを型付きで取り出すローダー (未知のキーは無視される)
export const loadStockListParams = createLoader(stockListParams);

// クエリ文字列を正規の順序に並べ直す
// 既知のキーを定義順に並べ、未知のキーはそのまま末尾に残す
// ブラウザのアドレスバーの URL 表示 (nuqs は操作順に書き込むため) の正規化に使う
export function normalizeStockListQuery(params: URLSearchParams): string {
  const normalized = new URLSearchParams();

  for (const key of Object.keys(stockListParams)) {
    for (const value of params.getAll(key)) {
      if (value !== "") {
        normalized.append(key, value);
      }
    }
  }
  for (const [key, value] of params) {
    if (!(key in stockListParams)) {
      normalized.append(key, value);
    }
  }

  return normalized.toString();
}
