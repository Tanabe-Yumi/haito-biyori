import { NextRequest, NextResponse } from "next/server";
import { createPythonStreamHandler, sseResponse } from "@/lib/python-stream";

const handler = createPythonStreamHandler("fetchStockPrices.py");

// python プロセス実行
// ?updatedBefore=YYYY-MM-DD: その日より前に更新された銘柄だけを対象にする (中断からの再開用)
export async function GET(request: NextRequest) {
  const updatedBefore = request.nextUrl.searchParams.get("updatedBefore");

  // 日付形式のみ許可 (スクリプトへ渡す引数のバリデーション)
  const extraArgs =
    updatedBefore && /^\d{4}-\d{2}-\d{2}$/.test(updatedBefore)
      ? ["--updated-before", updatedBefore]
      : [];

  return sseResponse(handler.createStream(extraArgs));
}

// python プロセスをキャンセル
export async function POST() {
  const stopped = handler.cancel();
  return NextResponse.json({
    message: stopped ? "停止中..." : "実行中の処理がありません",
  });
}
