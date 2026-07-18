"use client";

import { ListPlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/components/PortfolioProvider";

// 現在表示中の銘柄を全てポートフォリオに追加するボタン
export function PortfolioBulkAddButton({ codes }: { codes: string[] }) {
  const portfolio = usePortfolio();
  if (!portfolio) {
    return null;
  }

  // 表示中の銘柄がすべて追加済みかどうか
  const allAdded =
    codes.length !== 0 && codes.every((code) => portfolio.codes.has(code));

  const handleClick = async () => {
    const added = await portfolio.addAll(codes);
    toast.success(
      added !== 0
        ? `${added}件をポートフォリオに追加しました`
        : "追加できる銘柄がありませんでした",
      { position: "bottom-right" },
    );
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={codes.length === 0 || allAdded}
      title="現在表示中の銘柄を全てポートフォリオに追加"
    >
      <ListPlusIcon className="size-4" />
      表示中を全て追加
    </Button>
  );
}
