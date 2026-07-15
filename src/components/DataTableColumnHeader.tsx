import { type Column } from "@tanstack/react-table";
import { CircleMinusIcon, FilterIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useStockListParams } from "@/hooks/use-search-params";
import { StockListValues } from "@/lib/stockListParams";

interface UniChoice {
  id: number;
  value: string;
  label: string;
}

interface DataTableColumnHeaderFilterableUniProps<
  TData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  // 単一選択は数値 (0 = 全て) のパラメータのみ
  paramName: "yield" | "score";
  choices: UniChoice[];
}

// 単一選択でフィルタできるカラムヘッダー
export function DataTableColumnHeaderFilterableUni<TData, TValue>({
  column,
  title,
  className,
  paramName,
  choices,
}: DataTableColumnHeaderFilterableUniProps<TData, TValue>) {
  const [params, setParams] = useStockListParams();
  const param = params[paramName];
  if (!column.getCanFilter()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const setParam = (newValue: number) => {
    // paramName は "yield" | "score" に限定されるため number の設定は型安全
    setParams({ [paramName]: newValue } as Partial<StockListValues>);
  };

  const handleChange = (newValue: string) => {
    if (!newValue) {
      return;
    }

    setParam(Number(newValue));
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="data-[state=open]:bg-accent -ml-3 h-8"
            aria-label={`${title}をフィルター`}
          >
            <span>{title}</span>
            <FilterIcon
              className={cn(
                "size-4 ml-1 stroke-amber-400",
                param !== 0 && "fill-amber-400",
              )}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-46">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-muted-foreground flex justify-between items-center">
              単一選択
              <Button
                variant="ghost"
                className="h-4 w-4"
                onClick={() => setParam(0)}
                aria-label={`${title}のフィルターを解除`}
              >
                <CircleMinusIcon className="size-4" />
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={String(param)}
              onValueChange={handleChange}
            >
              {choices.map((choice) => (
                <DropdownMenuRadioItem key={choice.id} value={choice.value}>
                  {choice.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface MultiChoice {
  id: number;
  value: string;
}

interface DataTableColumnHeaderFilterableMultiProps<
  TData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  // 複数選択は ID リスト (number[]) のパラメータのみ
  paramName: "market" | "industry";
  choices: MultiChoice[];
}

// 複数選択でフィルタできるカラムヘッダー
export function DataTableColumnHeaderFilterableMulti<TData, TValue>({
  column,
  title,
  className,
  paramName,
  choices,
}: DataTableColumnHeaderFilterableMultiProps<TData, TValue>) {
  const [params, setParams] = useStockListParams();
  const param = params[paramName];

  if (!column.getCanFilter()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const setParam = (newValues: number[]) => {
    // paramName は "market" | "industry" に限定されるため number[] の設定は型安全
    setParams({ [paramName]: newValues } as Partial<StockListValues>);
  };

  const toggleChecked = (additionalValue: number) => {
    if (!additionalValue) {
      return;
    }

    // パラメータ変更
    if (param.includes(additionalValue)) {
      setParam(param.filter((v) => v !== additionalValue));
    } else {
      setParam([...param, additionalValue]);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="data-[state=open]:bg-accent -ml-3 h-8"
            aria-label={`${title}をフィルター`}
          >
            <span>{title}</span>
            <FilterIcon
              className={cn(
                "size-4 ml-1 stroke-amber-400",
                param.length !== 0 && "fill-amber-400",
              )}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-46">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-muted-foreground flex justify-between items-center">
              複数選択
              <Button
                variant="ghost"
                className="h-4 w-4"
                onClick={() => setParam([])}
                aria-label={`${title}のフィルターを解除`}
              >
                <CircleMinusIcon className="size-4" />
              </Button>
            </DropdownMenuLabel>
            {choices.map((choice) => (
              <DropdownMenuCheckboxItem
                key={choice.id}
                checked={param.includes(choice.id)}
                onCheckedChange={() => toggleChecked(choice.id)}
              >
                {choice.value}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
