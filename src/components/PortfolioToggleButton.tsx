"use client";

import { CheckIcon, PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/components/PortfolioProvider";

// ポートフォリオへの追加/削除トグルボタン (一覧の行用)
export function PortfolioToggleButton({ code }: { code: string }) {
  const portfolio = usePortfolio();
  if (!portfolio) {
    return null;
  }

  const isAdded = portfolio.codes.has(code);

  return (
    <Button
      variant={isAdded ? "secondary" : "ghost"}
      size="icon"
      className={cn(
        "size-8",
        isAdded &&
          "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900",
      )}
      onClick={() => portfolio.toggle(code)}
      aria-label={
        isAdded ? "ポートフォリオから削除" : "ポートフォリオに追加"
      }
      title={isAdded ? "ポートフォリオから削除" : "ポートフォリオに追加"}
    >
      {isAdded ? <CheckIcon /> : <PlusIcon />}
    </Button>
  );
}
