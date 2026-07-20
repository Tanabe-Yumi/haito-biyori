import { NextRequest, NextResponse } from "next/server";
import {
  createPythonStreamHandler,
  resolveUpdatedBeforeArgs,
  sseResponse,
} from "@/lib/python-stream";

const handler = createPythonStreamHandler("fetchStockPrices.py");

// python プロセス実行
// ?resume=1 または ?updatedBefore=YYYY-MM-DD:
// その日より前に更新された銘柄だけを対象にする (中断からの再開用)
export async function GET(request: NextRequest) {
  const extraArgs = resolveUpdatedBeforeArgs(request.nextUrl.searchParams);
  return sseResponse(handler.createStream(extraArgs));
}

// python プロセスをキャンセル
export async function POST() {
  const stopped = handler.cancel();
  return NextResponse.json({
    message: stopped ? "停止中..." : "実行中の処理がありません",
  });
}
