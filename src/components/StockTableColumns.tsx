"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { StockWithTotalScore } from "@/types/stock";
import { Badge } from "@/components/ui/badge";
import { PortfolioToggleButton } from "@/components/PortfolioToggleButton";

// バッジの配色 (一覧のセル内とポートフォリオページで共通)
export const marketBadgeClass =
  "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 border-purple-200 dark:border-purple-800";
export const industryBadgeClass =
  "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 border-sky-200 dark:border-sky-800";

// 企業名のリンク
// 現在の検索条件 (クエリ文字列) を詳細ページへ引き継ぎ、「一覧に戻る」で復元できるようにする
function StockNameLink({ stock }: { stock: StockWithTotalScore }) {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const { code, name, market, industry } = stock;

  return (
    <div>
      {/* コードを銘柄名の上に小さく表示 (リンクの外) */}
      <div className="text-xs font-medium text-muted-foreground">{code}</div>
      <Link
        href={query ? `/stocks/${code}?${query}` : `/stocks/${code}`}
        className="hover:underline font-extrabold hover:text-emerald-600 hover:font-bold decoration-emerald-500/50 underline-offset-4 decoration-2 block transition-all"
      >
        {name}
      </Link>
      {/* md 未満では市場・業種の列が消えるため、バッジで補完する
          (リンクの外に置き、詳細ページへの遷移対象にしない) */}
      {(market || industry) && (
        <div className="mt-1 flex flex-wrap gap-1 md:hidden">
          {market && (
            <Badge variant="secondary" className={marketBadgeClass}>
              {market}
            </Badge>
          )}
          {industry && (
            <Badge variant="secondary" className={industryBadgeClass}>
              {industry}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// TODO: カラム幅を固定したい

// 画面幅が小さいときに優先度の低い列を隠すためのクラス (meta.className として th/td に付与)
// 常時表示: 企業名・配当利回り・スコア
const showFromSm = "hidden sm:table-cell";
const showFromMd = "hidden md:table-cell";

export const columns: ColumnDef<StockWithTotalScore>[] = [
    {
      accessorKey: "name",
      header: "企業名",
      cell: ({ row }) => <StockNameLink stock={row.original} />,
    },
    {
      accessorKey: "market",
      meta: { className: showFromMd },
      header: () => <div className="text-center">市場</div>,
      cell: ({ row }) => {
        const market = row.getValue("market") as string;
        if (!market) return <div className="text-center px-4">-</div>;
        return (
          <div className="text-center">
            <Badge variant="secondary" className={marketBadgeClass}>
              {market}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "industry",
      meta: { className: showFromMd },
      header: () => <div className="text-center">業種</div>,
      cell: ({ row }) => {
        const industry = row.getValue("industry") as string;
        if (!industry) return <div className="text-center px-4">-</div>;
        return (
          <div className="text-center">
            <Badge variant="secondary" className={industryBadgeClass}>
              {industry}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      enableGlobalFilter: false,
      meta: { className: showFromSm },
      header: () => <div className="text-center">現在値</div>,
      cell: ({ row }) => {
        const price = row.getValue("price") as number | undefined;
        if (!price) return <div className="text-center px-4">-</div>;

        const formatted = new Intl.NumberFormat("ja-JP", {
          style: "currency",
          currency: "JPY",
        }).format(price);

        return <div className="text-center font-medium px-4">{formatted}</div>;
      },
    },
    {
      accessorKey: "dividendYield",
      enableGlobalFilter: false,
      header: () => <div className="text-center">配当利回り</div>,
      cell: ({ row }) => {
        const yieldVal = row.getValue("dividendYield") as number | undefined;
        if (!yieldVal) return <div className="text-center px-4">-</div>;
        return <div className="text-center font-medium px-4">{yieldVal}%</div>;
      },
    },
    {
      accessorKey: "score.total",
      id: "totalScore",
      enableGlobalFilter: false,
      header: () => <div className="text-center">スコア</div>,
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
    {
      id: "portfolio",
      enableGlobalFilter: false,
      header: () => <div className="text-center">PF</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <PortfolioToggleButton code={row.original.code} />
        </div>
      ),
    },
];
