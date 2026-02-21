"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StockWithTotalScore } from "@/types/stock";
import { Badge } from "@/components/ui/badge";

// TODO: カラム幅を固定したい

// TODO: 画面サイズに応じて表示する項目を変更

export const columns: ColumnDef<StockWithTotalScore>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          コード
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium px-4">{row.getValue("code")}</div>
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
    accessorKey: "industry",
    header: "業種",
    cell: ({ row }) => {
      const industry = row.getValue("industry") as string;
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
    // RODO: market と industry の順番を逆にする
    accessorKey: "market",
    header: "市場",
    cell: ({ row }) => {
      const market = row.getValue("market") as string;
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
    accessorKey: "price",
    enableGlobalFilter: false,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          現在値
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = row.getValue("price") as number | undefined;
      if (price === undefined) return <div className="text-right px-4">-</div>;

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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          配当利回り
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const yieldVal = row.getValue("dividendYield") as number | undefined;
      if (yieldVal === undefined)
        return <div className="text-right px-4">-</div>;
      return (
        <div className="text-right font-bold text-emerald-600 px-4">
          {yieldVal}%
        </div>
      );
    },
  },
  {
    accessorKey: "score.total",
    id: "totalScore",
    enableGlobalFilter: false,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          合計点
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const score = row.original.totalScore;
      if (score === undefined) return <div className="text-center px-4">-</div>;
      return <div className="text-center font-black text-lg px-4">{score}</div>;
    },
    accessorFn: (row) => row.totalScore,
  },
];
