"use client";

import { CircleMinusIcon, FilterIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStockListParams } from "@/hooks/use-search-params";
import { StockListValues } from "@/lib/stockListParams";
import { dividendYieldRange } from "@/constants/stock";
import { scoreRanges } from "@/constants/score";
import { Market } from "@/types/market";
import { Industry } from "@/types/industry";

interface StockFilterMenuProps {
  markets: Market[];
  industries: Industry[];
}

// 絞り込みメニュー
// 市場・業種 (複数選択) と配当利回り・スコア (単一選択) をまとめたドロップダウン
export function StockFilterMenu({ markets, industries }: StockFilterMenuProps) {
  const [params, setParams] = useStockListParams();

  // 適用中のフィルタ数 (デフォルトの利回り3.5%も絞り込みとして数える)
  const activeCount =
    (params.market.length !== 0 ? 1 : 0) +
    (params.industry.length !== 0 ? 1 : 0) +
    (params.yield !== 0 ? 1 : 0) +
    (params.score !== 0 ? 1 : 0);

  // 市場・業種の選択をトグルする
  // フィルタ変更で結果が変わるためページを 1 に戻す
  const toggleId = (key: "market" | "industry", id: number) => {
    const current = params[key];
    const next = current.includes(id)
      ? current.filter((v) => v !== id)
      : [...current, id];
    setParams({ [key]: next, page: 1 } as Partial<StockListValues>);
  };

  // 選択中の値をサブメニューの右側に小さく表示
  const selectedLabel = (label: string | undefined) =>
    label && (
      <span className="ml-auto pl-4 text-xs text-muted-foreground">
        {label}
      </span>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label="絞り込み">
          <FilterIcon
            className={cn(
              "size-4 stroke-amber-400",
              activeCount !== 0 && "fill-amber-400",
            )}
          />
          絞り込み
          {activeCount !== 0 && (
            <Badge
              variant="secondary"
              className="h-5 min-w-5 rounded-full px-1"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {/* 市場 (複数選択) */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            市場
            {selectedLabel(
              params.market.length !== 0
                ? `${params.market.length}件選択`
                : undefined,
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
            {markets.map((market) => (
              <DropdownMenuCheckboxItem
                key={market.id}
                checked={params.market.includes(market.id)}
                onCheckedChange={() => toggleId("market", market.id)}
                // 連続で選択できるよう、選択してもメニューを閉じない
                onSelect={(e) => e.preventDefault()}
              >
                {market.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* 業種 (複数選択) */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            業種
            {selectedLabel(
              params.industry.length !== 0
                ? `${params.industry.length}件選択`
                : undefined,
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
            {industries.map((industry) => (
              <DropdownMenuCheckboxItem
                key={industry.id}
                checked={params.industry.includes(industry.id)}
                onCheckedChange={() => toggleId("industry", industry.id)}
                onSelect={(e) => e.preventDefault()}
              >
                {industry.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* 配当利回り (単一選択) */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            配当利回り
            {selectedLabel(
              params.yield !== 0 ? `${params.yield}%~` : undefined,
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={String(params.yield)}
              onValueChange={(value) =>
                setParams({ yield: Number(value), page: 1 })
              }
            >
              {dividendYieldRange.map((choice) => (
                <DropdownMenuRadioItem key={choice.id} value={choice.value}>
                  {choice.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* スコア (単一選択) */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            スコア
            {selectedLabel(
              params.score !== 0 ? `${params.score}以上` : undefined,
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={String(params.score)}
              onValueChange={(value) =>
                setParams({ score: Number(value), page: 1 })
              }
            >
              {scoreRanges.map((choice) => (
                <DropdownMenuRadioItem key={choice.id} value={choice.value}>
                  {choice.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* すべて解除 */}
        <DropdownMenuItem
          onSelect={() =>
            setParams({ market: [], industry: [], yield: 0, score: 0, page: 1 })
          }
        >
          <CircleMinusIcon className="size-4" />
          すべて解除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
