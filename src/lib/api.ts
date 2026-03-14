import { supabase } from "@/lib/supabase";
import {
  StockWithTotalScore,
  StockWithScores,
  FinancialStatement,
  StockPage,
} from "@/types/stock";
import { Market } from "@/types/market";
import { Industry } from "@/types/industry";

// TODO: エラーハンドリング

// TODO: npx supabase xxx

// コードと名前を取得
// タブ名変更用
export async function getStockNameByCode(
  code: string,
): Promise<{ name: string }> {
  const { data, error } = await supabase
    .from("stocks")
    .select("name")
    .eq("code", code);

  if (error || !data) {
    console.error("Error fetching stock:", error);
    throw error;
  }

  return {
    name: data[0].name,
  };
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
  // ページネーション
  const from = page * rows;
  const to = from + rows - 1;

  // select from view(stocks left join scores on code)
  let query = supabase
    .from("stocks_with_total_score")
    .select("*", { count: "exact" });

  // 検索
  if (search) {
    // TODO: ユースケースに沿って検索方法を決める
    // TODO: 検索用カラムから fts カラムを作成し、検索対象とする

    // web検索構文
    // query = query.textSearch("fts", search, { type: "websearch" });

    // code,name であいまい検索
    // - ilike: 大文字小文字を区別しない like
    // - 複数単語が不可
    // query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);

    // fts (full text search) を使用
    // - 複数単語を順不同で検索。各単語は完全一致でヒット
    query = query.textSearch("fts", search.split(/\s+/).join(" & "), {
      config: "simple",
    });
  }

  // 条件で絞り込み
  if (markets && markets.length !== 0) {
    query = query.in("market_id", markets);
  }
  if (industries && industries.length !== 0) {
    query = query.in("industry_id", industries);
  }
  if (minDividendYield) {
    query = query.gte("dividend_yield", minDividendYield);
  }
  if (minScore) {
    query = query.gte("total_score", minScore);
  }

  // 最後にソートと範囲指定
  query = query
    .order("total_score", { ascending: false, nullsFirst: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error || !data) {
    console.error("Error fetching stocks:", error);
    throw error;
  }

  // Stock 型にマッピング
  const stocks: StockWithTotalScore[] = data.map((s) => {
    // !: code,name,updated_at が not null のテーブルの inner join であるため、null でないとして扱う
    return {
      code: s.code!,
      name: s.name!,
      industry: s.industry_name,
      market: s.market_name,
      price: s.price,
      dividendYield: s.dividend_yield,
      totalScore: s.total_score,
      updatedAt: s.updated_at!,
    };
  });

  return { stocks, totalCount: count ?? 0 };
}

// 引数のコードに一致する銘柄の、基本データとスコアを取得
export async function getStockWithScoresByCode(
  code: string,
): Promise<StockWithScores> {
  const { data, error } = await supabase
    .from("stocks_with_scores")
    .select("*")
    .eq("code", code);

  if (error || !data) {
    console.error("Error fetching stock:", error);
    throw error;
  }

  return {
    code: data[0].code!,
    name: data[0].name!,
    industry: data[0].industry,
    market: data[0].market,
    price: data[0].price,
    dividendYield: data[0].dividend_yield,
    updatedAt: data[0].updated_at!,
    totalScore: data[0].total_score,
    salesScore: data[0].sales_score,
    operatingProfitMarginScore: data[0].operating_profit_margin_score,
    epsScore: data[0].earnings_per_share_score,
    operatingCFScore: data[0].operating_cash_flow_score,
    dividendPerShareScore: data[0].dividend_per_share_score,
    payoutRatioScore: data[0].payout_ratio_score,
    equityRatioScore: data[0].equity_ratio_score,
    cashScore: data[0].cash_score,
  };
}

// 引数のコードに一致する銘柄の、過去の決算データを取得
export async function getFinancialHistoryByCode(
  code: string,
): Promise<FinancialStatement[]> {
  const { data, error } = await supabase
    .from("financial_history")
    .select("*")
    .eq("code", code)
    .order("year", { ascending: true });

  if (error || !data) {
    console.error("Error fetching history:", error);
    throw error;
  }

  const financialHistory: FinancialStatement[] = data.map((f) => {
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
  const { data, error } = await supabase.from("markets").select("*");

  if (error || !data) {
    console.error("Error fetching market:", error);
    throw error;
  }

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
  const { data, error } = await supabase.from("industries").select("*");

  if (error || !data) {
    console.error("Error fetching industry:", error);
    throw error;
  }

  const industries: Industry[] = data.map((m) => {
    return {
      id: m.id,
      name: m.name,
    };
  });

  return industries;
}
