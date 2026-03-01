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
  paramName: string;
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
  const [param, setParam] = useSearchParam(paramName);
  if (!column.getCanFilter()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const handleChange = (newValue: string) => {
    if (!newValue) {
      return;
    }

    setParam(newValue);
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
                param && "fill-amber-400",
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
                onClick={() => setParam("")}
                aria-label={`${title}のフィルターを解除`}
              >
                <CircleMinusIcon className="size-4" />
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={param} onValueChange={handleChange}>
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
  paramName: string;
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
  const [param, setParam] = useSearchParam(paramName);

  if (!column.getCanFilter()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const toggleChecked = (additionalValue: number) => {
    if (!additionalValue) {
      return;
    }

    const currentValues = param
      .split(",")
      .filter((p) => p !== "")
      .map((p) => parseInt(p));
    // パラメータ変更
    if (currentValues.includes(additionalValue)) {
      setParam(currentValues.filter((v) => v !== additionalValue).join(","));
    } else {
      setParam([...currentValues, additionalValue].join(","));
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
                param && "fill-amber-400",
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
                onClick={() => setParam("")}
                aria-label={`${title}のフィルターを解除`}
              >
                <CircleMinusIcon className="size-4" />
              </Button>
            </DropdownMenuLabel>
            {choices.map((choice) => (
              <DropdownMenuCheckboxItem
                key={choice.id}
                checked={param
                  .split(",")
                  .map((p) => parseInt(p))
                  .includes(choice.id)}
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
