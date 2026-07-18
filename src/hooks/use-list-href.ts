"use client";

import { useSearchParams } from "next/navigation";

import {
  loadStockListParams,
  serializeStockListParams,
} from "@/lib/stockListParams";

// 現在の URL に含まれる検索条件を保持した、銘柄一覧ページへの href
// (検索条件のキーだけを正規の順序で引き継ぐ。f= などの他のキーは含めない)
export function useListHref(): string {
  const searchParams = useSearchParams();
  return serializeStockListParams("/", loadStockListParams(searchParams));
}
