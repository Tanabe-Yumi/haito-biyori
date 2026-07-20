import { NextRequest, NextResponse } from "next/server";
import { createPythonStreamHandler, sseResponse } from "@/lib/python-stream";

const handler = createPythonStreamHandler("syncStockList.py");

// python プロセス実行
// ?dryRun=1: DB を更新せず、差分の確認だけを行う
export async function GET(request: NextRequest) {
  const dryRun = request.nextUrl.searchParams.get("dryRun");
  const extraArgs = dryRun === "1" ? ["--dry-run"] : [];

  return sseResponse(handler.createStream(extraArgs));
}

// python プロセスをキャンセル
export async function POST() {
  const stopped = handler.cancel();
  return NextResponse.json({
    message: stopped ? "停止中..." : "実行中の処理がありません",
  });
}
