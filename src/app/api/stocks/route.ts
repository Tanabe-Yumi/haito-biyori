import { NextRequest, NextResponse } from "next/server";
import { getStocksWithTotalScore } from "@/lib/api";
import { loadStockListParams } from "@/lib/stockListParams";

export async function GET(request: NextRequest) {
  // パラメータ取り出し (短縮キー q, m, i, y, s, p, r を論理名で受け取る)
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
  // 0 基準のページ番号に直す
  const page = params.page ? parseInt(params.page) - 1 : null;
  const rows = params.rows ? parseInt(params.rows) : null;

  const result = await getStocksWithTotalScore(
    params.search || null,
    markets,
    industries,
    minYield,
    minScore,
    page ?? undefined,
    rows ?? undefined,
  );

  return NextResponse.json(result);
}
