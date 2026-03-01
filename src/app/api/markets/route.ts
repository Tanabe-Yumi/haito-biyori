import { NextResponse } from "next/server";
import { getMarkets } from "@/lib/api";

export async function GET() {
  const result = await getMarkets();
  return NextResponse.json(result);
}
