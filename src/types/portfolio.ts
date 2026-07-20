// ポートフォリオ一覧のソート対象の列
export type PortfolioSortKey =
  | "name"
  | "industry"
  | "price"
  | "dividendYield"
  | "totalScore"
  | "shares"
  | "amount"
  | "dividend";

export type SortOrder = "asc" | "desc";

export interface PortfolioSort {
  key: PortfolioSortKey;
  order: SortOrder;
}

// ポートフォリオの保有予定銘柄 (銘柄情報と結合済み)
export interface PortfolioStock {
  code: string;
  name: string;
  // 業種
  industry: string | null;
  // 株価
  price: number | null;
  // 配当利回り (%)
  dividendYield: number | null;
  // 合計スコア
  totalScore: number | null;
  // 保有予定株数
  shares: number;
}
