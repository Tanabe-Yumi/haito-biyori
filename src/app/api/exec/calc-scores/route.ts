import { NextRequest, NextResponse } from "next/server";
import { createPythonStreamHandler, sseResponse } from "@/lib/python-stream";

const handler = createPythonStreamHandler("calculateScores.py");

// python プロセス実行
// ?updatedBefore=YYYY-MM-DD: スコアが未計算、またはその日より前に計算された銘柄だけを対象にする
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
