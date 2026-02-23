"use client";

import { StockWithTotalScore } from "@/types/stock";
import { DataTable } from "@/components/DataTable";
import { columns } from "@/components/StockTableColumns";

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
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">銘柄一覧</h2>
      </div>
      <DataTable
        columns={columns}
        data={stocks}
        total={total}
        isLoading={isLoading}
      />
    </div>
  );
}
