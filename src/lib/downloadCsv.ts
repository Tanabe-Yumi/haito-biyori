import { StockWithScores } from "@/types/stock";
import { formatDate } from "@/lib/formatDate";

export const downloadCsv = (headers: string[], data: StockWithScores[]) => {
  // csv データ作成
  const csvHeader = headers.join(",");
  const csvRows = data.map((row) => [
    `${row.code},${row.name},${row.market},${row.industry},${row.price},${row.dividendYield},${row.totalScore},${row.salesScore},${row.operatingProfitMarginScore},${row.epsScore},${row.operatingCFScore},${row.dividendPerShareScore},${row.payoutRatioScore},${row.equityRatioScore},${row.cashScore},${formatDate(new Date(row.updatedAt))}`,
  ]);
  const csvString = [csvHeader, ...csvRows].join("\n");

  // blob オブジェクト作成
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const blob = new Blob([bom, csvString], {
    type: "text/csv;charset=utf-8;",
  });

  // ダウンロード
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "配当びより_stocks.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
