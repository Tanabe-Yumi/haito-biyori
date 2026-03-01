import { useState } from "react";
import { LoaderIcon, SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useSearchParam } from "@/hooks/use-search-params";

interface SearchBoxProps {
  isLoading: boolean;
}

const SearchBox = ({ isLoading }: SearchBoxProps) => {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useSearchParam("search");

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setQuery(search.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <InputGroup className="max-w-xs">
        <InputGroupInput
          placeholder="銘柄名やコードで検索..."
          value={search}
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
