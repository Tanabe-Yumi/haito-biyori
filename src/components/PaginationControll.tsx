import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStockListParams } from "@/hooks/use-search-params";

interface PaginationControllProps {
  total: number;
}

const PaginationControll = ({ total }: PaginationControllProps) => {
  const [{ page, rows }, setParams] = useStockListParams();
  // 0 基準のページ番号に直す
  const currentPage = page - 1;
  const totalPages = Math.ceil(total / rows);

  const setPageQuery = (page: number) => {
    // 画面表示と同じ値をクエリに設定 (1 ~ totalPages)
    let newPage = page + 1;
    if (newPage < 1) {
      newPage = 1;
    } else if (newPage > totalPages) {
      newPage = totalPages;
    }

    setParams({ page: newPage });
  };

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        onClick={() => setPageQuery(0)}
        disabled={currentPage <= 0}
        aria-label="最初のページへ"
      >
        <ChevronsLeftIcon />
        {/* 狭い幅ではアイコンのみ表示 */}
        <span className="hidden sm:inline">最初へ</span>
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
        aria-label="最後のページへ"
      >
        <span className="hidden sm:inline">最後へ</span>
        <ChevronsRightIcon />
      </Button>
    </div>
  );
};

export default PaginationControll;
