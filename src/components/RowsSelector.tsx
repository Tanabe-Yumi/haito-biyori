import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParam } from "@/hooks/use-search-params";

const RowsSelector = () => {
  const [page, setPage] = useSearchParam("page");
  const [rows, setRows] = useSearchParam("rows");
  const currentRows = parseInt(rows) || 10;

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={`${currentRows}`}
        onValueChange={(row) => {
          setPage(`${1}`);
          setRows(row);
        }}
      >
        <SelectTrigger className="h-8 w-24">
          <SelectValue placeholder={`${currentRows} 件`} />
        </SelectTrigger>
        <SelectContent side="top">
          {[5, 10, 25, 50, 75, 100].map((pageSize) => (
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
