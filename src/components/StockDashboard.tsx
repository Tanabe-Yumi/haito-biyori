"use client";

import { StockWithTotalScore } from "@/types/stock";
import { DataTable } from "@/components/DataTable";
import { columns } from "@/components/StockTableColumns";
import { DividendFilter } from "@/components/DividendFilter";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface StockDashboardProps {
  stocks: StockWithTotalScore[];
  total: number;
  currentPage: number;
  pageSize: number;
}

export function StockDashboard({
  stocks,
  total,
  currentPage,
  pageSize = 20,
}: StockDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // テーブルのページ変更ハンドラ
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">銘柄一覧</h2>
        <DividendFilter />
      </div>
      <DataTable
        columns={columns}
        data={stocks}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
