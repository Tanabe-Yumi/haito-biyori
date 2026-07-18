import { StockWithScores } from "@/types/stock";
import { PortfolioStock } from "@/types/portfolio";
import { formatDate } from "@/lib/formatDate";
import { annualDividend, purchaseAmount } from "@/lib/portfolio";
import { portfolioCsvHeaders } from "@/constants/csv";

// 汎用: 行データを CSV ファイルとしてダウンロードする
export const downloadCsvFile = (
  filename: string,
  headers: string[],
  rows: (string | number | null)[][],
) => {
  // csv データ作成
  const csvString = [
    headers.join(","),
    ...rows.map((row) => row.map((value) => value ?? "").join(",")),
  ].join("\n");

  // blob オブジェクト作成 (BOM 付き UTF-8: Excel の文字化け対策)
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const blob = new Blob([bom, csvString], {
    type: "text/csv;charset=utf-8;",
  });

  // ダウンロード
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 銘柄一覧 (全スコア付き) の CSV ダウンロード
export const downloadCsv = (headers: string[], data: StockWithScores[]) => {
  downloadCsvFile(
    "配当びより_stocks.csv",
    headers,
    data.map((row) => [
      row.code,
      row.name,
      row.market,
      row.industry,
      row.price,
      row.dividendYield,
      row.totalScore,
      row.salesScore,
      row.operatingProfitMarginScore,
      row.epsScore,
      row.operatingCFScore,
      row.dividendPerShareScore,
      row.payoutRatioScore,
      row.equityRatioScore,
      row.cashScore,
      formatDate(new Date(row.updatedAt)),
    ]),
  );
};

// ポートフォリオの CSV ダウンロード
// 画面と同じ計算 (購入金額・年間配当・構成比) を行い、そのまま出力する
export const downloadPortfolioCsv = (stocks: PortfolioStock[]) => {
  const totalAmount = stocks.reduce(
    (sum, stock) => sum + (purchaseAmount(stock) ?? 0),
    0,
  );

  downloadCsvFile(
    "配当びより_portfolio.csv",
    portfolioCsvHeaders,
    stocks.map((stock) => {
      const amount = purchaseAmount(stock);
      const dividend = annualDividend(stock);
      return [
        stock.code,
        stock.name,
        stock.industry,
        stock.price,
        stock.dividendYield,
        stock.totalScore,
        stock.shares,
        amount != null ? Math.round(amount) : null,
        dividend != null ? Math.round(dividend) : null,
        amount != null && totalAmount !== 0
          ? ((amount / totalAmount) * 100).toFixed(1)
          : null,
      ];
    }),
  );
};
