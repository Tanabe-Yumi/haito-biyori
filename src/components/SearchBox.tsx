import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderIcon, SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useStockListParams } from "@/hooks/use-search-params";
import { SEARCH_DEBOUNCE_MS } from "@/constants/search";

interface SearchBoxProps {
  isLoading: boolean;
}

const SearchBox = ({ isLoading }: SearchBoxProps) => {
  const [{ search: query }, setParams] = useStockListParams();
  // 入力欄の値 (初期値は URL の検索クエリ)
  const [search, setSearch] = useState(query);
  const searchRef = useRef<HTMLInputElement>(null);

  // 検索クエリへ反映し、結果が変わるためページを 1 に戻す
  const applySearch = useCallback(
    (value: string) => {
      setParams({ search: value.trim(), page: 1 });
    },
    [setParams],
  );

  // インクリメンタル検索
  // 入力が止まって SEARCH_DEBOUNCE_MS 経過したら自動で検索する
  useEffect(() => {
    if (search.trim() === query) {
      return;
    }
    const timer = setTimeout(() => applySearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, query, applySearch]);

  // Enter や検索ボタンでは待たずに即時検索
  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    applySearch(search);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <InputGroup className="max-w-xs">
        <InputGroupInput
          placeholder="銘柄名やコードで検索..."
          value={search}
          ref={searchRef}
          onChange={(e) => setSearch(e.target.value)}
          disabled={isLoading}
        />
        <InputGroupAddon>
          {isLoading ? (
            <LoaderIcon className="size-4 animate-spin" />
          ) : (
            <SearchIcon />
          )}
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSearch("");
              searchRef.current?.focus();
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="検索キーワードをクリア"
            title="検索キーワードをクリア"
            disabled={isLoading}
          >
            <XIcon className="h-4 w-4" />
          </button>
        </InputGroupAddon>
      </InputGroup>
      <Button
        type="submit"
        className="text-base font-semibold bg-emerald-600 hover:bg-emerald-600/80"
        disabled={isLoading}
      >
        検索
      </Button>
    </form>
  );
};

export default SearchBox;
