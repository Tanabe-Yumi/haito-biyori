import {
  createLoader,
  createSerializer,
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  type inferParserType,
} from "nuqs/server";

// 一覧ページのクエリパラメータ定義
// - ここでのキーの定義順が、URL に直列化するときの正規の順序になる
// - パーサーにより値は型付きで取り出される (不正値はデフォルト値になる)
// - デフォルト値と同じ値は URL から省略される
export const stockListParams = {
  search: parseAsString.withDefault(""),
  // 市場・業種はカンマ区切りの ID リスト (例: m=1,2)
  market: parseAsArrayOf(parseAsInteger).withDefault([]),
  industry: parseAsArrayOf(parseAsInteger).withDefault([]),
  // 0 は「全て」(フィルタなし)
  yield: parseAsFloat.withDefault(0),
  score: parseAsInteger.withDefault(0),
  // ページ番号は 1 始まり
  page: parseAsInteger.withDefault(1),
  rows: parseAsInteger.withDefault(10),
};

// パース後の値の型 (search: string, market: number[], page: number, ...)
export type StockListValues = inferParserType<typeof stockListParams>;

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

// クエリを正規の順序・短縮キーで直列化する (デフォルト値のキーは省略される)
// canonical URL や内部リンクの組み立てに使い、同条件のURLを常に同一文字列にする
export const serializeStockListParams = createSerializer(stockListParams, {
  urlKeys: stockListUrlKeys,
});

// searchParams から既知のキーだけを型付きで取り出すローダー (未知のキーは無視される)
export const loadStockListParams = createLoader(stockListParams, {
  urlKeys: stockListUrlKeys,
});

// クエリ文字列を正規の形に並べ直す
// - 既知のキーを定義順・短縮キーに揃え、不正値やデフォルト値は除去する
// - 旧形式のフル名キー (search= など) は短縮キーに変換する (ブックマーク互換)
// - 未知のキーはそのまま末尾に残す
// ブラウザのアドレスバーの URL 表示 (nuqs は操作順に書き込むため) の正規化に使う
export function normalizeStockListQuery(params: URLSearchParams): string {
  // 旧形式のフル名キーを短縮キーへ変換
  const translated = new URLSearchParams(params);
  for (const [name, urlKey] of Object.entries(stockListUrlKeys)) {
    const legacyValue = translated.get(name);
    if (legacyValue !== null) {
      if (!translated.has(urlKey)) {
        translated.set(urlKey, legacyValue);
      }
      translated.delete(name);
    }
  }

  // 既知のキーをパースし、正規の順序・形式で直列化 ("?" 始まりのため除去)
  const knownQuery = serializeStockListParams(
    loadStockListParams(translated),
  ).replace(/^\?/, "");

  // 未知のキーはそのまま末尾に残す
  const knownKeys = new Set<string>(Object.values(stockListUrlKeys));
  const unknown = new URLSearchParams();
  for (const [key, value] of translated) {
    if (!knownKeys.has(key)) {
      unknown.append(key, value);
    }
  }
  const unknownQuery = unknown.toString();

  return [knownQuery, unknownQuery].filter(Boolean).join("&");
}
