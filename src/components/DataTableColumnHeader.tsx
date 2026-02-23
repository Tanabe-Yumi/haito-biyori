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
import { useSearchParam } from "@/hooks/use-search-params";

// TODO: クエリパラメーターに渡す値を DB の ID にする (markets,industries を DB 保存にする)

interface Choice {
  id: number;
  value: string;
  label: string;
}

interface DataTableColumnHeaderFilterableProps<
  TData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  queryParam: string;
  choices: Choice[];
}

// 単一選択でフィルタできるカラムヘッダー
export function DataTableColumnHeaderFilterableUni<TData, TValue>({
  column,
  title,
  className,
  queryParam,
  choices,
}: DataTableColumnHeaderFilterableProps<TData, TValue>) {
  const [query, setQuery] = useSearchParam(queryParam);
  if (!column.getCanFilter()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const handleChange = (newValue: string) => {
    if (!newValue) {
      return;
    }

    setQuery(newValue);
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
                query && "fill-amber-400",
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
                onClick={() => setQuery("")}
                aria-label={`${title}のフィルターを解除`}
              >
                <CircleMinusIcon className="size-4" />
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={query} onValueChange={handleChange}>
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

// 複数選択でフィルタできるカラムヘッダー
export function DataTableColumnHeaderFilterableMulti<TData, TValue>({
  column,
  title,
  className,
  queryParam,
  choices,
}: DataTableColumnHeaderFilterableProps<TData, TValue>) {
  const [query, setQuery] = useSearchParam(queryParam);

  if (!column.getCanFilter()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const toggleChecked = (additionalValue: string) => {
    if (!additionalValue) {
      return;
    }

    const currentValues = query.split(",");
    // パラメータ変更
    if (currentValues.includes(additionalValue)) {
      setQuery(currentValues.filter((v) => v !== additionalValue).join(","));
    } else {
      setQuery([...currentValues, additionalValue].join(","));
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
                query && "fill-amber-400",
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
                onClick={() => setQuery("")}
                aria-label={`${title}のフィルターを解除`}
              >
                <CircleMinusIcon className="size-4" />
              </Button>
            </DropdownMenuLabel>
            {choices.map((choice) => (
              <DropdownMenuCheckboxItem
                key={choice.id}
                checked={query.split(",").includes(choice.value)}
                onCheckedChange={() => toggleChecked(choice.value)}
              >
                {choice.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
