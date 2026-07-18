"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DownloadIcon, Trash2Icon, WalletIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { industryBadgeClass } from "@/components/StockTableColumns";
import { PortfolioIndustryBreakdown } from "@/components/PortfolioIndustryBreakdown";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PortfolioStock } from "@/types/portfolio";
import { FROM_PARAM_KEY, FROM_PORTFOLIO } from "@/constants/portfolio";
import { downloadPortfolioCsv } from "@/lib/downloadCsv";
import { annualDividend, purchaseAmount } from "@/lib/portfolio";

// 円表示のフォーマッタ
const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
});

export const PortfolioPage = () => {
  const [stocks, setStocks] = useState<PortfolioStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portfolio")
      .then((res) => res.json())
      .then((data) => {
        setStocks(data);
        setIsLoading(false);
      })
      .catch((e) => console.error("Error fetching portfolio:", e));
  }, []);

  // 株数を変更 (画面は即時更新し、保存は裏で行う)
  const updateShares = (code: string, shares: number) => {
    setStocks((prev) =>
      prev.map((s) => (s.code === code ? { ...s, shares } : s)),
    );
    fetch(`/api/portfolio/${code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shares }),
    }).catch((e) => console.error("Error updating shares:", e));
  };

  // 銘柄を削除
  const removeStock = (code: string) => {
    setStocks((prev) => prev.filter((s) => s.code !== code));
    fetch(`/api/portfolio/${code}`, { method: "DELETE" }).catch((e) =>
      console.error("Error removing stock:", e),
    );
  };

  // サマリー
  const totalAmount = stocks.reduce(
    (sum, s) => sum + (purchaseAmount(s) ?? 0),
    0,
  );
  const totalDividend = stocks.reduce(
    (sum, s) => sum + (annualDividend(s) ?? 0),
    0,
  );
  const portfolioYield =
    totalAmount !== 0 ? (totalDividend / totalAmount) * 100 : null;
  const industryCount = new Set(
    stocks.map((s) => s.industry).filter((i) => i != null),
  ).size;

  // 表示中のポートフォリオを CSV でダウンロード
  const handleDownloadCsv = () => {
    try {
      downloadPortfolioCsv(stocks);
      toast.success("CSVダウンロードに成功しました", {
        position: "bottom-right",
      });
    } catch (e) {
      toast.error(`CSVダウンロードに失敗しました: ${e}`, {
        position: "bottom-right",
      });
    }
  };

  const summaries = [
    { label: "銘柄数", value: `${stocks.length}` },
    { label: "業種数", value: `${industryCount}` },
    { label: "購入金額", value: yen.format(Math.round(totalAmount)) },
    {
      label: "年間配当 (税引前)",
      value: yen.format(Math.round(totalDividend)),
    },
    {
      label: "PF利回り",
      value: portfolioYield != null ? `${portfolioYield.toFixed(2)}%` : "-",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <WalletIcon className="text-emerald-600 size-6" />
          ポートフォリオ
        </h1>
        <p className="text-muted-foreground text-sm">
          保有予定の銘柄と株数を調整して、分散と配当のバランスを確認できます。金額は現在値ベース、配当は税引前です。
        </p>
      </section>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {summaries.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-emerald-100 dark:border-emerald-900/50 bg-card p-4"
          >
            <p className="text-xs text-muted-foreground font-medium">
              {item.label}
            </p>
            <p className="text-xl font-bold mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {/* 業種分散 */}
      <PortfolioIndustryBreakdown stocks={stocks} />

      {/* 保有予定銘柄テーブル */}
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>銘柄</TableHead>
              <TableHead className="text-center">業種</TableHead>
              <TableHead className="text-center">現在値</TableHead>
              <TableHead className="text-center">利回り</TableHead>
              <TableHead className="text-center">スコア</TableHead>
              <TableHead className="text-center">株数</TableHead>
              <TableHead className="text-center">購入金額</TableHead>
              <TableHead className="text-center">年間配当</TableHead>
              <TableHead className="text-center">構成比</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  読み込み中...
                </TableCell>
              </TableRow>
            ) : stocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  ポートフォリオに銘柄がありません。
                  <Link
                    href="/"
                    className="text-emerald-600 hover:underline ml-1"
                  >
                    銘柄一覧
                  </Link>
                  から追加してください。
                </TableCell>
              </TableRow>
            ) : (
              stocks.map((stock) => {
                const amount = purchaseAmount(stock);
                const dividend = annualDividend(stock);
                const ratio =
                  amount != null && totalAmount !== 0
                    ? (amount / totalAmount) * 100
                    : null;

                return (
                  <TableRow key={stock.code}>
                    <TableCell>
                      <div className="text-xs font-medium text-muted-foreground">
                        {stock.code}
                      </div>
                      <Link
                        // 詳細ページの「戻る」をポートフォリオ向きにする
                        href={`/stocks/${stock.code}?${FROM_PARAM_KEY}=${FROM_PORTFOLIO}`}
                        className="font-extrabold hover:underline hover:text-emerald-600 decoration-emerald-500/50 underline-offset-4 decoration-2 transition-all"
                      >
                        {stock.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      {stock.industry ? (
                        <Badge
                          variant="secondary"
                          className={industryBadgeClass}
                        >
                          {stock.industry}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {stock.price != null ? yen.format(stock.price) : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {stock.dividendYield != null
                        ? `${stock.dividendYield}%`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center font-black text-lg text-emerald-600">
                      {stock.totalScore ?? "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={stock.shares}
                        onChange={(e) => {
                          const shares = parseInt(e.target.value);
                          updateShares(
                            stock.code,
                            Number.isNaN(shares) || shares < 0 ? 0 : shares,
                          );
                        }}
                        className="w-24 mx-auto text-right"
                        aria-label={`${stock.name}の株数`}
                      />
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {amount != null ? yen.format(Math.round(amount)) : "-"}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {dividend != null
                        ? yen.format(Math.round(dividend))
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {ratio != null ? `${ratio.toFixed(1)}%` : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-rose-600"
                        onClick={() => removeStock(stock.code)}
                        aria-label={`${stock.name}をポートフォリオから削除`}
                      >
                        <Trash2Icon />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* CSVダウンロード */}
      <Button
        variant="secondary"
        onClick={handleDownloadCsv}
        disabled={stocks.length === 0}
      >
        <DownloadIcon />
        CSVダウンロード
      </Button>
    </div>
  );
};
