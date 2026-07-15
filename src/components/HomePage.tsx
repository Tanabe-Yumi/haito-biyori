"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { normalizeStockListQuery } from "@/lib/stockListParams";
import { toast } from "sonner";
import { DownloadIcon } from "lucide-react";

import { StockDashboard } from "@/components/StockDashboard";
import { Button } from "@/components/ui/button";
import { headers } from "@/constants/csvHeader";
import { downloadCsv } from "@/lib/downloadCsv";
import { StockWithTotalScore } from "@/types/stock";

export const HomePage = () => {
  const endpoint = "/api/stocks";

  // TODO: フィルタ変更時も isLoading を対応させる
  const [isLoading, setIsLoading] = useState(true);
  const [stocks, setStocks] = useState<StockWithTotalScore[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  // csv ダウンロード
  const [isDownloading, setIsDownloading] = useState(false);

  const searchParams = useSearchParams();
  // 直前にフェッチしたクエリ (正規化済み)
  const lastFetchedQuery = useRef<string | null>(null);

  // クエリパラメーターが変更されるたびにデータ更新
  useEffect(() => {
    const normalizedQuery = normalizeStockListQuery(searchParams);

    // アドレスバーの URL を正規の順序に置き換える
    // nuqs は操作した順にパラメータを書き込むため、順序をスキーマの定義順に揃える
    // (replaceState なので履歴は増えない)
    // 比較は URLSearchParams を通し、"," と "%2C" のようなエンコード差を無視する
    const isSameQuery =
      new URLSearchParams(normalizedQuery).toString() ===
      searchParams.toString();
    if (!isSameQuery) {
      window.history.replaceState(
        null,
        "",
        normalizedQuery ? `?${normalizedQuery}` : window.location.pathname,
      );
    }

    // 順序が変わっただけなら再フェッチしない
    if (lastFetchedQuery.current === normalizedQuery) {
      return;
    }
    lastFetchedQuery.current = normalizedQuery;

    fetch(`${endpoint}?${normalizedQuery}`, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => {
        setStocks(data.stocks);
        setTotalCount(data.totalCount);
        setIsLoading(false);
      })
      // 500 エラーがある
      .catch((e) => console.error(e));
    // TODO: エラー処理
  }, [searchParams]);

  // クエリ条件に一致する銘柄をダウンロード
  const handleDownloadCsv = () => {
    setIsDownloading(true);
    // toast でダウンロード状況を通知
    toast.promise<string>(
      () =>
        new Promise((resolve, reject) => {
          const allQueryParameters = normalizeStockListQuery(searchParams);
          fetch(`${endpoint}/export?${allQueryParameters}`, {
            method: "GET",
          })
            .then((res) => res.json())
            .then((data) => {
              downloadCsv(headers, data);
              resolve("success");
            })
            .catch((e) => {
              reject(e);
            })
            .finally(() => setIsDownloading(false));
        }),
      {
        loading: "CSVダウンロードを準備中...",
        success: "CSVダウンロードに成功しました",
        error: (e) => `CSVダウンロードに失敗しました: ${e}`,
        position: "bottom-right",
      },
    );
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl inline-block bg-linear-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
          高配当株スコアリング
        </h1>
        <p className="text-foreground max-w-2xl text-lg">
          配当利回り3.5%以上の優良銘柄を8つの指標で厳選分析。スコアが高いほど健全な財務と高い還元期待を持てます。
        </p>
      </section>

      <StockDashboard
        stocks={stocks}
        total={totalCount}
        isLoading={isLoading}
      />

      <Button
        variant="secondary"
        onClick={handleDownloadCsv}
        disabled={isDownloading}
      >
        <DownloadIcon />
        CSVダウンロード
      </Button>
    </div>
  );
};
