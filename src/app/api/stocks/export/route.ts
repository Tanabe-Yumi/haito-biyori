import { NextRequest, NextResponse } from "next/server";
import { getStocksWithScores } from "@/lib/api";
import { loadStockListParams } from "@/lib/stockListParams";
import { EXPORT_BATCH_SIZE } from "@/constants/csv";
import { StockWithScores } from "@/types/stock";

export async function GET(request: NextRequest) {
  // パラメータ取り出し (短縮キー q, m, i, y, s を論理名・型付きで受け取る)
  const params = loadStockListParams(request.nextUrl.searchParams);

  let results: StockWithScores[] = [];
  let getCount = 0;
  let _totalCount = 1;
  let page = 0;

  // クエリ条件の全件を取得
  while (getCount < _totalCount) {
    const { stocks, totalCount } = await getStocksWithScores(
      params.search || null,
      params.market,
      params.industry,
      params.yield || null,
      params.score || null,
      page,
      EXPORT_BATCH_SIZE,
    );

    results = [...results, ...stocks];
    getCount += stocks.length;
    _totalCount = totalCount;
    page += 1;
  }

  return NextResponse.json(results);
}
