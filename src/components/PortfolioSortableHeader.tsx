"use client";

import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { TableHead } from "@/components/ui/table";

import { PortfolioSort, PortfolioSortKey } from "@/types/portfolio";

interface PortfolioSortableHeaderProps {
  sortKey: PortfolioSortKey;
  // 現在のソート状態 (未ソートなら null)
  sort: PortfolioSort | null;
  onSort: (key: PortfolioSortKey) => void;
  className?: string;
  children: React.ReactNode;
}

// クリックでソートできるテーブルヘッダー
export function PortfolioSortableHeader({
  sortKey,
  sort,
  onSort,
  className,
  children,
}: PortfolioSortableHeaderProps) {
  const isActive = sort?.key === sortKey;
  const Icon = !isActive
    ? ChevronsUpDownIcon
    : sort.order === "asc"
      ? ArrowUpIcon
      : ArrowDownIcon;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        aria-label={`${children}で並び替え`}
      >
        {children}
        <Icon
          className={cn(
            "size-3.5",
            isActive ? "text-emerald-600" : "text-muted-foreground/50",
          )}
        />
      </button>
    </TableHead>
  );
}
