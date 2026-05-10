import { NextRequest, NextResponse } from "next/server";
import { getStocksWithScores } from "@/lib/api";
import { StockWithScores } from "@/types/stock";

export async function GET(request: NextRequest) {
  const requestLimit = 1000;
  const searchParams = request.nextUrl.searchParams;

  // パラメータ取り出し
  const searchParam = searchParams.get("search");
  const marketParam = searchParams.get("market");
  const industryParam = searchParams.get("industry");
  const minYieldParam = searchParams.get("yield");
  const minScoreParam = searchParams.get("score");

  // 引数用の変数準備
  const markets = marketParam
    ? marketParam
        .split(",")
        .filter((m) => m !== "")
        .map((m) => parseInt(m))
    : null;
  const industries = industryParam
    ? industryParam
        .split(",")
        .filter((m) => m !== "")
        .map((m) => parseInt(m))
    : null;
  const minYield = minYieldParam ? parseFloat(minYieldParam) : null;
  const minScore = minScoreParam ? parseFloat(minScoreParam) : null;

  let results: StockWithScores[] = [];
  let getCount = 0;
  let _totalCount = 1;
  let page = 0;

  // クエリ条件の全件を取得
  while (getCount < _totalCount) {
    const { stocks, totalCount } = await getStocksWithScores(
      searchParam,
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
