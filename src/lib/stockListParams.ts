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

// 論理名 → URL 上の短縮キー
// URL を短く保つため1文字にする (search は検索クエリの慣習に合わせて q)
export const stockListUrlKeys = {
  search: "q",
  market: "m",
  industry: "i",
  yield: "y",
  score: "s",
  page: "p",
  rows: "r",
} as const satisfies Record<keyof typeof stockListParams, string>;

export type StockListParamName = keyof typeof stockListUrlKeys;

// クエリを正規の順序・短縮キーで直列化する (デフォルト値 "" のキーは省略される)
// canonical URL や内部リンクの組み立てに使い、同条件のURLを常に同一文字列にする
export const serializeStockListParams = createSerializer(stockListParams, {
  urlKeys: stockListUrlKeys,
});

// searchParams から既知のキーだけを型付きで取り出すローダー (未知のキーは無視される)
export const loadStockListParams = createLoader(stockListParams, {
  urlKeys: stockListUrlKeys,
});

// クエリ文字列を正規の形に並べ直す
// - 既知のキーを定義順・短縮キーに揃える
// - 旧形式のフル名キー (search= など) は短縮キーに変換する (ブックマーク互換)
// - 未知のキーはそのまま末尾に残す
// ブラウザのアドレスバーの URL 表示 (nuqs は操作順に書き込むため) の正規化に使う
export function normalizeStockListQuery(params: URLSearchParams): string {
  const normalized = new URLSearchParams();

  for (const [name, urlKey] of Object.entries(stockListUrlKeys)) {
    // 短縮キーを優先しつつ、旧形式のフル名キーも受け付ける
    for (const value of [...params.getAll(urlKey), ...params.getAll(name)]) {
      if (value !== "") {
        normalized.append(urlKey, value);
      }
    }
  }

  const knownKeys = new Set<string>([
    ...Object.keys(stockListUrlKeys),
    ...Object.values(stockListUrlKeys),
  ]);
  for (const [key, value] of params) {
    if (!knownKeys.has(key)) {
      normalized.append(key, value);
    }
  }

  return normalized.toString();
}
