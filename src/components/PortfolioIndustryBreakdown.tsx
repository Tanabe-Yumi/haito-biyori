"use client";

import { useState } from "react";
import {
  AlertTriangleIcon,
  Building2Icon,
  ChevronDownIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { PortfolioStock } from "@/types/portfolio";
import { INDUSTRY_CONCENTRATION_WARNING_RATIO } from "@/constants/portfolio";

// 円表示のフォーマッタ
const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
});

interface PortfolioIndustryBreakdownProps {
  stocks: PortfolioStock[];
}

// 業種ごとの購入金額の内訳
// 構成比順の横バーで表示し、偏りが大きい業種には警告を出す
// 開閉状態の保存キー (ページ遷移やリロードを跨いで前回の状態を復元する)
const OPEN_STORAGE_KEY = "portfolio-industry-breakdown-open";

export function PortfolioIndustryBreakdown({
  stocks,
}: PortfolioIndustryBreakdownProps) {
  // バーリストの開閉状態 (ヘッダーと偏り警告は畳んでいても常に表示する)
  // 初期値は前回の状態を localStorage から復元 (未保存なら開いた状態)
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return localStorage.getItem(OPEN_STORAGE_KEY) !== "closed";
  });

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      localStorage.setItem(OPEN_STORAGE_KEY, next ? "open" : "closed");
      return next;
    });
  };

  // 業種ごとに購入金額を集計 (株価未取得の銘柄は除外)
  const amounts = new Map<string, number>();
  for (const stock of stocks) {
    if (stock.price == null || stock.shares === 0) {
      continue;
    }
    const industry = stock.industry ?? "未分類";
    amounts.set(
      industry,
      (amounts.get(industry) ?? 0) + stock.price * stock.shares,
    );
  }

  const totalAmount = [...amounts.values()].reduce((sum, v) => sum + v, 0);
  if (totalAmount === 0) {
    return null;
  }

  // 構成比の降順に並べる
  const industries = [...amounts.entries()]
    .map(([name, amount]) => ({
      name,
      amount,
      ratio: (amount / totalAmount) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 偏り警告 (しきい値を超える業種)
  const concentrated = industries.filter(
    (i) => i.ratio >= INDUSTRY_CONCENTRATION_WARNING_RATIO,
  );

  return (
    <div className="rounded-md border bg-card p-4 md:p-6 space-y-4">
      {/* ヘッダー (クリックでバーリストを開閉) */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={isOpen}
        className="w-full font-bold flex items-center gap-2 cursor-pointer"
      >
        <Building2Icon className="text-emerald-600 size-5" />
        業種分散
        <span className="text-sm font-normal text-muted-foreground">
          {industries.length}業種
        </span>
        <ChevronDownIcon
          className={cn(
            "size-4 ml-auto text-muted-foreground transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* 偏り警告 */}
      {concentrated.length !== 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-sm p-3">
          <AlertTriangleIcon className="size-4 shrink-0 mt-0.5" />
          <p>
            {concentrated
              .map((i) => `${i.name}に${Math.round(i.ratio)}%`)
              .join("、")}
            集中しています。分散の調整を検討してください。
          </p>
        </div>
      )}

      {/* 構成比バー (構成比の降順) */}
      {isOpen && (
        <div className="space-y-3">
        {industries.map((industry) => (
          <div key={industry.name} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">{industry.name}</span>
              <span className="text-muted-foreground tabular-nums">
                {yen.format(Math.round(industry.amount))}
                <span className="inline-block w-14 text-right font-medium text-foreground">
                  {industry.ratio.toFixed(1)}%
                </span>
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${industry.ratio}%` }}
              />
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
}
