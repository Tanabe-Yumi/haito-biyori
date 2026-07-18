import { NextRequest, NextResponse } from "next/server";
import { removePortfolioStock, updatePortfolioShares } from "@/lib/api";

interface RouteContext {
  params: Promise<{ code: string }>;
}

// 株数を更新
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { code } = await params;
  const body = await request.json().catch(() => null);
  const shares = body?.shares;

  if (typeof shares !== "number" || !Number.isInteger(shares) || shares < 0) {
    return NextResponse.json(
      { error: "shares must be a non-negative integer" },
      { status: 400 },
    );
  }

  await updatePortfolioShares(code, shares);
  return NextResponse.json({ ok: true });
}

// ポートフォリオから銘柄を削除
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { code } = await params;
  await removePortfolioStock(code);
  return NextResponse.json({ ok: true });
}
