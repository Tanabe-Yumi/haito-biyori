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
export interface StockWithTotalScore extends Stock {
  totalScore: number | null;
}

// 銘柄情報 with 全スコア
export interface StockWithScores extends Stock {
  score: Score | null;
}

// スコア
export interface Score extends EvaluationItems {
  total: number | null;
}

// 決算情報
// 内容が同じのため Score を流用
export interface FinancialStatement extends EvaluationItems {
  code: string;
  year: number;
  month: number;
}
