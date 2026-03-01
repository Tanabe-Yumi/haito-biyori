import { NextResponse } from "next/server";
import { getIndustries } from "@/lib/api";

export async function GET() {
  const result = await getIndustries();
  return NextResponse.json(result);
}
