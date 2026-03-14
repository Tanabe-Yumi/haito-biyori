"use client";

import { useEffect, useState } from "react";
import { DownloadIcon } from "lucide-react";

import { StockWithTotalScore } from "@/types/stock";
import { Market } from "@/types/market";
import { Industry } from "@/types/industry";
import { DataTable } from "@/components/DataTable";
import { columns } from "@/components/StockTableColumns";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/downloadCsv";
import { headers } from "@/constants/csvHeader";

interface StockDashboardProps {
  stocks: StockWithTotalScore[];
  total: number;
  isLoading: boolean;
}

export function StockDashboard({
  stocks,
  total,
  isLoading,
}: StockDashboardProps) {
  const marketEndpoint = "/api/markets";
  const industryEndpoint = "/api/industries";

  const [markets, setMarkets] = useState<Market[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);

  useEffect(() => {
    // 市場データを取得
    fetch(marketEndpoint, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => setMarkets(data));

    // 業種データを取得
    fetch(industryEndpoint, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => setIndustries(data));
  }, []);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">銘柄一覧</h2>
      </div>
      <DataTable
        columns={columns(markets, industries)}
        data={stocks}
        total={total}
        isLoading={isLoading}
      />

      {/* CSVダウンロード */}
      <div>
        <Button
          variant="secondary"
          onClick={() => downloadCsv(headers, stocks)}
        >
          <DownloadIcon />
          CSVダウンロード
        </Button>
      </div>
    </div>
  );
}
