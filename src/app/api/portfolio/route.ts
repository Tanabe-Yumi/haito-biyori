import { NextRequest, NextResponse } from "next/server";
import {
  addPortfolioStocks,
  clearPortfolioStocks,
  getPortfolioStocks,
} from "@/lib/api";

// ポートフォリオの保有予定銘柄一覧を取得
export async function GET() {
  const stocks = await getPortfolioStocks();
  return NextResponse.json(stocks);
}

// ポートフォリオに銘柄を追加
// body: { code: "xxxx" } または { codes: ["xxxx", ...] } (一括追加)
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  // code / codes のどちらでも受け付ける
  const codes: unknown = body?.codes ?? (body?.code ? [body.code] : null);

  if (
    !Array.isArray(codes) ||
    codes.length === 0 ||
    codes.some((c) => typeof c !== "string" || c === "")
  ) {
    return NextResponse.json(
      { error: "code or codes is required" },
      { status: 400 },
    );
  }

  try {
    await addPortfolioStocks(codes);
  } catch (error) {
    // 存在しない銘柄コードは外部キー制約で失敗する
    console.error("Error adding portfolio stocks:", error);
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

// ポートフォリオの全銘柄を削除
export async function DELETE() {
  await clearPortfolioStocks();
  return NextResponse.json({ ok: true });
}
