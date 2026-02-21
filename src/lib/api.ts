import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database.types";
import {
  StockWithTotalScore,
  StockWithScores,
  Score,
  FinancialStatement,
} from "@/types/stock";

// TODO: エラーハンドリング

// 銘柄リストと総数
export interface StockPage {
  stocks: StockWithTotalScore[];
  totalCount: number;
}

function mapToScore(scores: Tables<"scores">): Score {
  return {
    sales: scores.sales,
    operatingProfitMargin: scores.operating_profit_margin,
    eps: scores.earnings_per_share,
    equityRatio: scores.equity_ratio,
    operatingCF: scores.operating_cash_flow,
    cash: scores.cash,
    dividendPerShare: scores.dividend_per_share,
    payoutRatio: scores.payout_ratio,
    total: scores.total,
  };
}

// select from stocks
export async function getStocksWithTotalScore(
  minDividendYield: number = 0,
  page: number = 0,
  pageSize: number = 20,
): Promise<StockPage> {
  // ページネーション
  const from = page * pageSize;
  const to = from + pageSize - 1;

  // select from view(stocks left join scores on code)
  const query = supabase
    .from("stocks_with_total_score")
    .select("*", { count: "exact" })
    .gte("dividend_yield", minDividendYield)
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
      industry: s.industry,
      market: s.market,
      price: s.price,
      dividendYield: s.dividend_yield,
      totalScore: s.total_score,
      updatedAt: s.updated_at!,
    };
  });

  return { stocks, totalCount: count ?? 0 };
}

// stocks join scores on code
export async function getStockWithScoresById(
  code: string,
): Promise<StockWithScores> {
  const { data, error } = await supabase
    .from("stocks")
    .select(
      `
      *,
      scores (*)
    `,
    )
    .eq("code", code);

  if (error || !data) {
    console.error("Error fetching stock:", error);
    throw error;
  }

  const score = data[0].scores ? mapToScore(data[0].scores) : null;

  return {
    code: data[0].code,
    name: data[0].name,
    industry: data[0].industry,
    market: data[0].market,
    price: data[0].price,
    dividendYield: data[0].dividend_yield,
    score,
    updatedAt: data[0].updated_at,
  };
}

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
