import { db } from "@/lib/db";
import {
  StockWithTotalScore,
  StockWithScores,
  FinancialStatement,
  StockPage,
  StockScoreList,
} from "@/types/stock";
import { Market } from "@/types/market";
import { Industry } from "@/types/industry";

// TODO: エラーハンドリング

// stocks_with_scores / stocks_with_total_score view の行
interface StockViewRow {
  code: string;
  name: string;
  market_id: number | null;
  market_name: string | null;
  industry_id: number | null;
  industry_name: string | null;
  price: number | null;
  dividend_yield: number | null;
  updated_at: string;
  total_score: number | null;
  sales_score: number | null;
  operating_profit_margin_score: number | null;
  earnings_per_share_score: number | null;
  operating_cash_flow_score: number | null;
  dividend_per_share_score: number | null;
  payout_ratio_score: number | null;
  equity_ratio_score: number | null;
  cash_score: number | null;
}

// financial_history テーブルの行
interface FinancialHistoryRow {
  code: string;
  year: number;
  month: number;
  sales: number | null;
  operating_profit_margin: number | null;
  earnings_per_share: number | null;
  operating_cash_flow: number | null;
  dividend_per_share: number | null;
  payout_ratio: number | null;
  equity_ratio: number | null;
  cash: number | null;
}

// 検索・絞り込み条件から where 句とバインド値を組み立てる
function buildStockFilters(
  search: string | null,
  markets: number[] | null,
  industries: number[] | null,
  minDividendYield: number | null,
  minScore: number | null,
): { where: string; params: (string | number)[] } {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  // 検索
  // 空白区切りの各単語が code または name に部分一致すればヒット (AND 条件)
  if (search) {
    for (const word of search.split(/\s+/).filter(Boolean)) {
      // like のワイルドカードをエスケープ
      const escaped = word.replace(/[\\%_]/g, "\\$&");
      conditions.push("(code like ? escape '\\' or name like ? escape '\\')");
      params.push(`%${escaped}%`, `%${escaped}%`);
    }
  }

  // 条件で絞り込み
  if (markets && markets.length !== 0) {
    conditions.push(`market_id in (${markets.map(() => "?").join(",")})`);
    params.push(...markets);
  }
  if (industries && industries.length !== 0) {
    conditions.push(`industry_id in (${industries.map(() => "?").join(",")})`);
    params.push(...industries);
  }
  if (minDividendYield) {
    conditions.push("dividend_yield >= ?");
    params.push(minDividendYield);
  }
  if (minScore) {
    conditions.push("total_score >= ?");
    params.push(minScore);
  }

  const where =
    conditions.length !== 0 ? `where ${conditions.join(" and ")}` : "";

  return { where, params };
}

// コードと名前を取得
// タブ名変更用
export async function getStockNameByCode(
  code: string,
): Promise<{ name: string }> {
  const row = db
    .prepare<[string], { name: string }>(
      "select name from stocks where code = ?",
    )
    .get(code);

  if (!row) {
    console.error("Error fetching stock: not found", code);
    throw new Error(`Stock not found: ${code}`);
  }

  return { name: row.name };
}

// 基本データと合計スコアを取得
// フィルターやページネーションが可能
export async function getStocksWithTotalScore(
  search: string | null,
  markets: number[] | null,
  industries: number[] | null,
  minDividendYield: number | null,
  minScore: number | null,
  page: number = 0,
  rows: number = 10,
): Promise<StockPage> {
  const { where, params } = buildStockFilters(
    search,
    markets,
    industries,
    minDividendYield,
    minScore,
  );

  // 総件数
  const { count } = db
    .prepare<
      (string | number)[],
      { count: number }
    >(`select count(*) as count from stocks_with_total_score ${where}`)
    .get(...params)!;

  // ソートとページネーション
  const data = db
    .prepare<(string | number)[], StockViewRow>(
      `select * from stocks_with_total_score
       ${where}
       order by total_score desc nulls last
       limit ? offset ?`,
    )
    .all(...params, rows, page * rows);

  // Stock 型にマッピング
  const stocks: StockWithTotalScore[] = data.map((s) => {
    return {
      code: s.code,
      name: s.name,
      industry: s.industry_name,
      market: s.market_name,
      price: s.price,
      dividendYield: s.dividend_yield,
      totalScore: s.total_score,
      updatedAt: s.updated_at,
    };
  });

  return { stocks, totalCount: count };
}

// 基本データとスコアを取得
// csv エクスポート用
export async function getStocksWithScores(
  search: string | null,
  markets: number[] | null,
  industries: number[] | null,
  minDividendYield: number | null,
  minScore: number | null,
  page: number = 0,
  rows: number = 10,
): Promise<StockScoreList> {
  const { where, params } = buildStockFilters(
    search,
    markets,
    industries,
    minDividendYield,
    minScore,
  );

  const { count } = db
    .prepare<
      (string | number)[],
      { count: number }
    >(`select count(*) as count from stocks_with_scores ${where}`)
    .get(...params)!;

  const data = db
    .prepare<(string | number)[], StockViewRow>(
      `select * from stocks_with_scores
       ${where}
       order by total_score desc nulls last
       limit ? offset ?`,
    )
    .all(...params, rows, page * rows);

  // マッピング
  const stocks: StockWithScores[] = data.map((s) => {
    return {
      code: s.code,
      name: s.name,
      industry: s.industry_name,
      market: s.market_name,
      price: s.price,
      dividendYield: s.dividend_yield,
      totalScore: s.total_score,
      salesScore: s.sales_score,
      operatingProfitMarginScore: s.operating_profit_margin_score,
      epsScore: s.earnings_per_share_score,
      operatingCFScore: s.operating_cash_flow_score,
      dividendPerShareScore: s.dividend_per_share_score,
      payoutRatioScore: s.payout_ratio_score,
      equityRatioScore: s.equity_ratio_score,
      cashScore: s.cash_score,
      updatedAt: s.updated_at,
    };
  });

  return { stocks, totalCount: count };
}

// 引数のコードに一致する銘柄の、基本データとスコアを取得
export async function getStockWithScoresByCode(
  code: string,
): Promise<StockWithScores> {
  const s = db
    .prepare<
      [string],
      StockViewRow
    >("select * from stocks_with_scores where code = ?")
    .get(code);

  if (!s) {
    console.error("Error fetching stock: not found", code);
    throw new Error(`Stock not found: ${code}`);
  }

  return {
    code: s.code,
    name: s.name,
    industry: s.industry_name,
    market: s.market_name,
    price: s.price,
    dividendYield: s.dividend_yield,
    updatedAt: s.updated_at,
    totalScore: s.total_score,
    salesScore: s.sales_score,
    operatingProfitMarginScore: s.operating_profit_margin_score,
    epsScore: s.earnings_per_share_score,
    operatingCFScore: s.operating_cash_flow_score,
    dividendPerShareScore: s.dividend_per_share_score,
    payoutRatioScore: s.payout_ratio_score,
    equityRatioScore: s.equity_ratio_score,
    cashScore: s.cash_score,
  };
}

// 決算データを取得
export async function getFinancialHistoryByCode(
  code: string,
  limit?: number,
): Promise<FinancialStatement[]> {
  // 直近 limit 件を取得するため降順で取得
  let sql =
    "select * from financial_history where code = ? order by year desc";
  const params: (string | number)[] = [code];

  // 最大件数を設定
  if (limit !== undefined && limit > 0) {
    sql += " limit ?";
    params.push(limit);
  }

  const data = db
    .prepare<(string | number)[], FinancialHistoryRow>(sql)
    .all(...params);

  // 昇順にソートして返却
  const financialHistory: FinancialStatement[] = data.reverse().map((f) => {
    return {
      code: f.code,
      year: f.year,
      month: f.month,
      sales: f.sales,
      operatingProfitMargin: f.operating_profit_margin,
      eps: f.earnings_per_share,
      operatingCF: f.operating_cash_flow,
      dividendPerShare: f.dividend_per_share,
      payoutRatio: f.payout_ratio,
      equityRatio: f.equity_ratio,
      cash: f.cash,
    };
  });

  return financialHistory;
}

// 全ての market データを取得
export async function getMarkets(): Promise<Market[]> {
  const data = db
    .prepare<[], { id: number; name: string }>("select id, name from markets")
    .all();

  const markets: Market[] = data.map((m) => {
    return {
      id: m.id,
      name: m.name,
    };
  });

  return markets;
}

// 全ての industry データを取得
export async function getIndustries(): Promise<Industry[]> {
  const data = db
    .prepare<
      [],
      { id: number; name: string }
    >("select id, name from industries")
    .all();

  const industries: Industry[] = data.map((m) => {
    return {
      id: m.id,
      name: m.name,
    };
  });

  return industries;
}
