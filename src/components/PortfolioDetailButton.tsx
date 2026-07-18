"use client";

import { useEffect, useState } from "react";
import { CheckIcon, PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// 詳細ページ用のポートフォリオ追加/削除ボタン
export function PortfolioDetailButton({ code }: { code: string }) {
  // null = 読み込み中
  const [isAdded, setIsAdded] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/portfolio")
      .then((res) => res.json())
      .then((stocks: { code: string }[]) =>
        setIsAdded(stocks.some((s) => s.code === code)),
      )
      .catch((e) => console.error("Error fetching portfolio:", e));
  }, [code]);

  const toggle = async () => {
    if (isAdded == null) {
      return;
    }

    // 楽観的更新
    const next = !isAdded;
    setIsAdded(next);

    try {
      if (next) {
        await fetch("/api/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
      } else {
        await fetch(`/api/portfolio/${code}`, { method: "DELETE" });
      }
    } catch (e) {
      console.error("Error toggling portfolio:", e);
      setIsAdded(!next);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={isAdded == null}
      className={cn(
        isAdded &&
          "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900",
      )}
    >
      {isAdded ? <CheckIcon /> : <PlusIcon />}
      {isAdded ? "ポートフォリオに追加済み" : "ポートフォリオに追加"}
    </Button>
  );
}
