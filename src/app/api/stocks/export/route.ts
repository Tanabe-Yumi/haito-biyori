import { NextRequest, NextResponse } from "next/server";
import { getStocksWithScores } from "@/lib/api";
import { loadStockListParams } from "@/lib/stockListParams";
import { StockWithScores } from "@/types/stock";

export async function GET(request: NextRequest) {
  const requestLimit = 1000;

  // パラメータ取り出し (短縮キー q, m, i, y, s を論理名で受け取る)
  const params = loadStockListParams(request.nextUrl.searchParams);

  // 引数用の変数準備
  const markets = params.market
    ? params.market
        .split(",")
        .filter((m) => m !== "")
        .map((m) => parseInt(m))
    : null;
  const industries = params.industry
    ? params.industry
        .split(",")
        .filter((m) => m !== "")
        .map((m) => parseInt(m))
    : null;
  const minYield = params.yield ? parseFloat(params.yield) : null;
  const minScore = params.score ? parseFloat(params.score) : null;

  let results: StockWithScores[] = [];
  let getCount = 0;
  let _totalCount = 1;
  let page = 0;

  // クエリ条件の全件を取得
  while (getCount < _totalCount) {
    const { stocks, totalCount } = await getStocksWithScores(
      params.search || null,
      markets,
      industries,
      minYield,
      minScore,
      page,
      requestLimit,
    );

    results = [...results, ...stocks];
    getCount += stocks.length;
    _totalCount = totalCount;
    page += 1;
  }

  return NextResponse.json(results);
}
