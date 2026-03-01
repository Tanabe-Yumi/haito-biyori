import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParam } from "@/hooks/use-search-params";

interface PaginationControllProps {
  total: number;
}

const PaginationControll = ({ total }: PaginationControllProps) => {
  const [page, setPage] = useSearchParam("page");
  const [rows] = useSearchParam("rows");
  const currentPage = parseInt(page) - 1 || 0;
  const currentRows = parseInt(rows) || 10;
  const totalPages = Math.ceil(total / currentRows);

  const setPageQuery = (page: number) => {
    // 画面表示と同じ値をクエリに設定 (1 ~ totalPages)
    let newPage = page + 1;
    if (newPage < 1) {
      newPage = 1;
    } else if (newPage > totalPages) {
      newPage = totalPages;
    }

    setPage(newPage.toString());
  };

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        onClick={() => setPageQuery(0)}
        disabled={currentPage <= 0}
      >
        <ChevronsLeftIcon />
        最初へ
      </Button>
      <Button
        variant="ghost"
        onClick={() => setPageQuery(currentPage - 1)}
        disabled={currentPage <= 0}
        aria-label="前のページへ"
      >
        <ChevronLeftIcon />
      </Button>
      {/* 今のページ数 */}
      <div className="flex w-10 items-center justify-center text-sm font-medium">
        {currentPage + 1}
      </div>
      <Button
        variant="ghost"
        onClick={() => setPageQuery(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        aria-label="次のページへ"
      >
        <ChevronRightIcon />
      </Button>
      <Button
        variant="ghost"
        onClick={() => setPageQuery(totalPages - 1)}
        disabled={currentPage >= totalPages - 1}
      >
        最後へ
        <ChevronsRightIcon />
      </Button>
    </div>
  );
};

export default PaginationControll;
