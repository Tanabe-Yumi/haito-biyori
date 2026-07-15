import { NextRequest, NextResponse } from "next/server";
import { getStocksWithTotalScore } from "@/lib/api";
import { loadStockListParams } from "@/lib/stockListParams";

export async function GET(request: NextRequest) {
  // パラメータ取り出し (短縮キー q, m, i, y, s, p, r を論理名・型付きで受け取る)
  // 不正な値はデフォルト値になる
  const params = loadStockListParams(request.nextUrl.searchParams);

  const result = await getStocksWithTotalScore(
    params.search || null,
    params.market,
    params.industry,
    params.yield || null,
    params.score || null,
    // 0 基準のページ番号に直す
    params.page - 1,
    params.rows,
  );

  return NextResponse.json(result);
}
