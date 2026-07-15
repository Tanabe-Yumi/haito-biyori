import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStockListParams } from "@/hooks/use-search-params";
import { ROWS_PER_PAGE_OPTIONS } from "@/constants/table";

const RowsSelector = () => {
  const [{ rows }, setParams] = useStockListParams();

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={`${rows}`}
        onValueChange={(row) => {
          // 表示件数の変更時は 1 ページ目に戻す
          setParams({ page: 1, rows: parseInt(row) });
        }}
      >
        <SelectTrigger className="h-8 w-24">
          <SelectValue placeholder={`${rows} 件`} />
        </SelectTrigger>
        <SelectContent side="top">
          {ROWS_PER_PAGE_OPTIONS.map((pageSize) => (
            <SelectItem key={pageSize} value={`${pageSize}`}>
              {pageSize} 件
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RowsSelector;
