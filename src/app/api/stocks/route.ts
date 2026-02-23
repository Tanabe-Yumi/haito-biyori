import { NextRequest, NextResponse } from "next/server";
import { getStocksWithTotalScore } from "@/lib/api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // パラメータ取り出し
  const searchParam = searchParams.get("search");
  const marketParam = searchParams.get("market");
  const industryParam = searchParams.get("industry");
  const minYieldParam = searchParams.get("yield");
  const minScoreParam = searchParams.get("score");

  // 引数用の変数準備
  const markets = marketParam ? marketParam.split(",") : null;
  const industries = industryParam ? industryParam.split(",") : null;
  const minYield = minYieldParam ? parseFloat(minYieldParam) : null;
  const minScore = minScoreParam ? parseFloat(minScoreParam) : null;

  // ページネーション
  const page = parseInt(searchParams.get("page") || "0");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const result = await getStocksWithTotalScore(
    searchParam,
    markets,
    industries,
    minYield,
    minScore,
    page,
    pageSize,
  );

  return NextResponse.json(result);
}
