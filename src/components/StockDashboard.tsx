"use client";

import { useEffect, useState } from "react";

import { StockWithTotalScore } from "@/types/stock";
import { Market } from "@/types/market";
import { Industry } from "@/types/industry";
import { DataTable } from "@/components/DataTable";
import { columns } from "@/components/StockTableColumns";
import { PortfolioProvider } from "@/components/PortfolioProvider";

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
      <PortfolioProvider>
        <DataTable
          columns={columns}
          data={stocks}
          total={total}
          isLoading={isLoading}
          markets={markets}
          industries={industries}
          visibleCodes={stocks.map((s) => s.code)}
        />
      </PortfolioProvider>
    </div>
  );
}
