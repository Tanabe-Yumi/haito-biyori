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
  const pageParam = searchParams.get("page");
  const rowsParam = searchParams.get("rows");

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
  // 0 基準のページ番号に直す
  const page = pageParam ? parseInt(pageParam) - 1 : null;
  const rows = rowsParam ? parseInt(rowsParam) : null;

  const result = await getStocksWithTotalScore(
    searchParam,
    markets,
    industries,
    minYield,
    minScore,
    page ?? undefined,
    rows ?? undefined,
  );

  return NextResponse.json(result);
}
