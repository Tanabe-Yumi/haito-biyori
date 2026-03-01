// 評価項目8つ
interface EvaluationItems {
  sales: number | null;
  operatingProfitMargin: number | null;
  eps: number | null;
  operatingCF: number | null;
  dividendPerShare: number | null;
  payoutRatio: number | null;
  equityRatio: number | null;
  cash: number | null;
}

// 銘柄情報
interface Stock {
  code: string;
  name: string;
  // 業種
  industry: string | null;
  // 市場
  market: string | null;
  // 株価
  price: number | null;
  // 配当利回り (%)
  dividendYield: number | null;
  updatedAt: string;
}

// 銘柄情報 with 合計スコア
// 一覧画面用
export interface StockWithTotalScore extends Stock {
  totalScore: number | null;
}

// 銘柄情報 with 全スコア
// 詳細画面用
export interface StockWithScores extends Stock {
  totalScore: number | null;
  salesScore: number | null;
  operatingProfitMarginScore: number | null;
  epsScore: number | null;
  operatingCFScore: number | null;
  dividendPerShareScore: number | null;
  payoutRatioScore: number | null;
  equityRatioScore: number | null;
  cashScore: number | null;
}

// 決算情報
export interface FinancialStatement extends EvaluationItems {
  code: string;
  year: number;
  month: number;
}
