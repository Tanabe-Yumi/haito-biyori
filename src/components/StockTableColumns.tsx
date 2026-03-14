"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { StockWithTotalScore } from "@/types/stock";
import { Market } from "@/types/market";
import { Industry } from "@/types/industry";
import { Badge } from "@/components/ui/badge";
import {
  DataTableColumnHeaderFilterableMulti,
  DataTableColumnHeaderFilterableUni,
} from "@/components/DataTableColumnHeader";
import { dividendYieldRange } from "@/constants/stock";
import { scoreRanges } from "@/constants/score";

// TODO: カラム幅を固定したい

// TODO: 画面サイズに応じて表示する項目を変更

export const columns = (
  markets: Market[],
  industries: Industry[],
): ColumnDef<StockWithTotalScore>[] => {
  return [
    {
      accessorKey: "code",
      header: () => <div className="text-center">コード</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium px-4">
          {row.getValue("code")}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "企業名",
      cell: ({ row }) => (
        <Link
          href={`/stocks/${row.original.code}`}
          className="hover:underline font-extrabold hover:text-emerald-600 hover:font-bold decoration-emerald-500/50 underline-offset-4 decoration-2 block transition-all"
        >
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      accessorKey: "market",
      header: ({ column }) => (
        <DataTableColumnHeaderFilterableMulti
          column={column}
          title="市場"
          paramName="market"
          choices={markets.map((m) => {
            return { id: m.id, value: m.name };
          })}
          className="flex justify-center items-center"
        />
      ),
      cell: ({ row }) => {
        const market = row.getValue("market") as string;
        if (!market) return <div className="px-4">-</div>;
        return (
          <Badge
            variant="secondary"
            className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 border-purple-200 dark:border-purple-800"
          >
            {market}
          </Badge>
        );
      },
    },
    {
      accessorKey: "industry",
      header: ({ column }) => (
        <DataTableColumnHeaderFilterableMulti
          column={column}
          title="業種"
          paramName="industry"
          choices={industries.map((i) => {
            return { id: i.id, value: i.name };
          })}
          className="flex justify-center items-center"
        />
      ),
      cell: ({ row }) => {
        const industry = row.getValue("industry") as string;
        if (!industry) return <div className="px-4">-</div>;
        return (
          <Badge
            variant="secondary"
            className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 border-sky-200 dark:border-sky-800"
          >
            {industry}
          </Badge>
        );
      },
    },
    {
      accessorKey: "price",
      enableGlobalFilter: false,
      header: () => <div className="text-center">現在値</div>,
      cell: ({ row }) => {
        const price = row.getValue("price") as number | undefined;
        if (!price) return <div className="text-right px-4">-</div>;

        const formatted = new Intl.NumberFormat("ja-JP", {
          style: "currency",
          currency: "JPY",
        }).format(price);

        return <div className="text-right font-medium px-4">{formatted}</div>;
      },
    },
    {
      accessorKey: "dividendYield",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeaderFilterableUni
          column={column}
          title="配当利回り"
          paramName="yield"
          choices={dividendYieldRange}
          className="flex justify-center items-center"
        />
      ),
      cell: ({ row }) => {
        // TODO: デフォルトを 3.5 にする
        const yieldVal = row.getValue("dividendYield") as number | undefined;
        if (!yieldVal) return <div className="text-right px-4">-</div>;
        return <div className="text-right font-medium px-4">{yieldVal}%</div>;
      },
    },
    {
      accessorKey: "score.total",
      id: "totalScore",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeaderFilterableUni
          column={column}
          title="スコア"
          paramName="score"
          choices={scoreRanges}
          className="flex justify-center items-center"
        />
      ),
      cell: ({ row }) => {
        const score = row.getValue("totalScore") as string;
        if (!score) return <div className="text-center px-4">-</div>;
        return (
          <div className="text-center font-black text-lg text-emerald-600 px-4">
            {score}
          </div>
        );
      },
      accessorFn: (row) => row.totalScore,
    },
  ];
};
