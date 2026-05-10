"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { DownloadIcon } from "lucide-react";

import { StockDashboard } from "@/components/StockDashboard";
import { Button } from "@/components/ui/button";
import { headers } from "@/constants/csvHeader";
import { downloadCsv } from "@/lib/downloadCsv";
import { StockWithTotalScore } from "@/types/stock";

const Home = () => {
  const endpoint = "/api/stocks";

  // TODO: フィルタ変更時も isLoading を対応させる
  const [isLoading, setIsLoading] = useState(true);
  const [stocks, setStocks] = useState<StockWithTotalScore[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  // csv ダウンロード
  const [isDownloading, setIsDownloading] = useState(false);

  const searchParams = useSearchParams();

  // クエリパラメーターが変更されるたびにデータ更新
  useEffect(() => {
    const allQueryParameters = searchParams.toString();
    fetch(`${endpoint}?${allQueryParameters}`, {
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
          const allQueryParameters = searchParams.toString();
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

export default Home;
