import { Expression, SqlBool, expressionBuilder, sql } from "kysely";
import { db, normalizeSearchText } from "@/lib/db";
import { DB } from "@/types/db";
import {
  StockWithTotalScore,
  StockWithScores,
  FinancialStatement,
  StockPage,
  StockScoreList,
} from "@/types/stock";
import { Market } from "@/types/market";
import { Industry } from "@/types/industry";
import { PortfolioStock } from "@/types/portfolio";

// TODO: エラーハンドリング

// フィルタ対象のビュー (どちらも同じ絞り込みカラムを持つ)
type StockView = "stocks_with_total_score" | "stocks_with_scores";

// 検索・絞り込み条件を where 式のリストに組み立てる
function buildStockFilters(
  search: string | null,
  markets: number[] | null,
  industries: number[] | null,
  minDividendYield: number | null,
  minScore: number | null,
): Expression<SqlBool>[] {
  const eb = expressionBuilder<DB, StockView>();
  const conditions: Expression<SqlBool>[] = [];

  // 検索
  // 空白区切りの各単語が code または name に部分一致すればヒット (AND 条件)
  // 全角/半角・大文字/小文字の違いを吸収するため、入力とカラムの両方を正規化して比較
  if (search) {
    for (const word of search.split(/\s+/).filter(Boolean)) {
      // 正規化してから like のワイルドカードをエスケープ
      const pattern = `%${normalizeSearchText(word).replace(/[\\%_]/g, "\\$&")}%`;
      conditions.push(
        eb.or([
          sql<SqlBool>`normalize_search(${eb.ref("code")}) like ${pattern} escape '\\'`,
          sql<SqlBool>`normalize_search(${eb.ref("name")}) like ${pattern} escape '\\'`,
        ]),
      );
    }
  }

  // 条件で絞り込み
  if (markets && markets.length !== 0) {
    conditions.push(eb("market_id", "in", markets));
  }
  if (industries && industries.length !== 0) {
    conditions.push(eb("industry_id", "in", industries));
  }
  if (minDividendYield) {
    conditions.push(eb("dividend_yield", ">=", minDividendYield));
  }
  if (minScore) {
    conditions.push(eb("total_score", ">=", minScore));
  }

  return conditions;
}

// コードと名前を取得
// タブ名変更用
export async function getStockNameByCode(
  code: string,
): Promise<{ name: string }> {
  const row = await db
    .selectFrom("stocks")
    .select("name")
    .where("code", "=", code)
    .executeTakeFirst();

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
  const eb = expressionBuilder<DB, StockView>();
  const conditions = buildStockFilters(
    search,
    markets,
    industries,
    minDividendYield,
    minScore,
  );

  // 総件数
  let countQuery = db
    .selectFrom("stocks_with_total_score")
    .select(({ fn }) => fn.countAll<number>().as("count"));
  // ソートとページネーション
  let dataQuery = db.selectFrom("stocks_with_total_score").selectAll();

  if (conditions.length !== 0) {
    countQuery = countQuery.where(eb.and(conditions));
    dataQuery = dataQuery.where(eb.and(conditions));
  }

  const { count } = await countQuery.executeTakeFirstOrThrow();
  const data = await dataQuery
    .orderBy("total_score", (ob) => ob.desc().nullsLast())
    .limit(rows)
    .offset(page * rows)
    .execute();

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
  const eb = expressionBuilder<DB, StockView>();
  const conditions = buildStockFilters(
    search,
    markets,
    industries,
    minDividendYield,
    minScore,
  );

  let countQuery = db
    .selectFrom("stocks_with_scores")
    .select(({ fn }) => fn.countAll<number>().as("count"));
  let dataQuery = db.selectFrom("stocks_with_scores").selectAll();

  if (conditions.length !== 0) {
    countQuery = countQuery.where(eb.and(conditions));
    dataQuery = dataQuery.where(eb.and(conditions));
  }

  const { count } = await countQuery.executeTakeFirstOrThrow();
  const data = await dataQuery
    .orderBy("total_score", (ob) => ob.desc().nullsLast())
    .limit(rows)
    .offset(page * rows)
    .execute();

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
  const s = await db
    .selectFrom("stocks_with_scores")
    .selectAll()
    .where("code", "=", code)
    .executeTakeFirst();

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
  let query = db
    .selectFrom("financial_history")
    .selectAll()
    .where("code", "=", code)
    .orderBy("year", "desc");

  // 最大件数を設定
  if (limit !== undefined && limit > 0) {
    query = query.limit(limit);
  }

  const data = await query.execute();

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
  const data = await db.selectFrom("markets").select(["id", "name"]).execute();

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
  const data = await db
    .selectFrom("industries")
    .select(["id", "name"])
    .execute();

  const industries: Industry[] = data.map((m) => {
    return {
      id: m.id,
      name: m.name,
    };
  });

  return industries;
}

// ポートフォリオの保有予定銘柄を取得
// スコアなしの銘柄も表示するため、ビューではなくテーブルを直接 join する
export async function getPortfolioStocks(): Promise<PortfolioStock[]> {
  const data = await db
    .selectFrom("portfolio_items")
    .innerJoin("stocks", "stocks.code", "portfolio_items.code")
    .leftJoin("industries", "industries.id", "stocks.industry")
    .leftJoin("scores", "scores.code", "stocks.code")
    .select([
      "portfolio_items.code as code",
      "stocks.name as name",
      "industries.name as industry",
      "stocks.price as price",
      "stocks.dividend_yield as dividendYield",
      "scores.total as totalScore",
      "portfolio_items.shares as shares",
    ])
    // 追加した順で安定させる
    .orderBy("portfolio_items.created_at")
    .execute();

  return data;
}

// ポートフォリオに銘柄を追加 (追加済みの銘柄は何もしない)
export async function addPortfolioStocks(codes: string[]): Promise<void> {
  if (codes.length === 0) {
    return;
  }

  await db
    .insertInto("portfolio_items")
    .values(codes.map((code) => ({ code })))
    .onConflict((oc) => oc.doNothing())
    .execute();
}

// ポートフォリオの株数を更新
export async function updatePortfolioShares(
  code: string,
  shares: number,
): Promise<void> {
  await db
    .updateTable("portfolio_items")
    .set({ shares })
    .where("code", "=", code)
    .execute();
}

// ポートフォリオから銘柄を削除
export async function removePortfolioStock(code: string): Promise<void> {
  await db.deleteFrom("portfolio_items").where("code", "=", code).execute();
}
