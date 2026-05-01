import { NextResponse } from "next/server";
import { createPythonStreamHandler, sseResponse } from "@/lib/python-stream";

const handler = createPythonStreamHandler("fetchStockPrices.py");

// python プロセス実行
export async function GET() {
  return sseResponse(handler.createStream());
}

// python プロセスをキャンセル
export async function POST() {
  const stopped = handler.cancel();
  return NextResponse.json({
    message: stopped ? "停止中..." : "実行中の処理がありません",
  });
}
