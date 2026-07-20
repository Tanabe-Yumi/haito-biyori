import { StockWithScores } from "@/types/stock";
import { PortfolioStock } from "@/types/portfolio";
import { formatDate } from "@/lib/formatDate";
import {
  annualDividend,
  breakdownByIndustry,
  purchaseAmount,
  summarizePortfolio,
} from "@/lib/portfolio";
import { portfolioCsvHeaders } from "@/constants/csv";

// CSV のセル値
type CsvValue = string | number | null;

// 値を CSV のセルとして整形する
// カンマ・引用符・改行を含む場合は引用符で囲む (銘柄名にカンマが含まれても崩れない)
const escapeCsvValue = (value: CsvValue): string => {
  if (value == null) {
    return "";
  }
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const toCsvRow = (row: CsvValue[]): string => row.map(escapeCsvValue).join(",");

// 汎用: 行データを CSV ファイルとしてダウンロードする
export const downloadCsvFile = (
  filename: string,
  headers: string[],
  rows: CsvValue[][],
) => {
  downloadCsvText(filename, [toCsvRow(headers), ...rows.map(toCsvRow)].join("\n"));
};

// 組み立て済みの CSV 文字列をファイルとしてダウンロードする
const downloadCsvText = (filename: string, csvString: string) => {

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
// 画面と同じ計算を行い、1ファイルに3つのセクションを出力する
//   1. サマリー (銘柄数・購入金額・年間配当・PF利回りなど)
//   2. 業種分散 (業種ごとの購入金額と構成比)
//   3. 保有予定銘柄の明細
export const downloadPortfolioCsv = (stocks: PortfolioStock[]) => {
  const summary = summarizePortfolio(stocks);
  const industries = breakdownByIndustry(stocks);
  const { totalAmount } = summary;

  const lines: string[] = [];

  // 1. サマリー
  lines.push(toCsvRow(["■ サマリー"]));
  lines.push(toCsvRow(["項目", "値"]));
  lines.push(toCsvRow(["銘柄数", summary.stockCount]));
  lines.push(toCsvRow(["業種数", summary.industryCount]));
  lines.push(toCsvRow(["購入金額", Math.round(totalAmount)]));
  lines.push(toCsvRow(["年間配当(税引前)", Math.round(summary.totalDividend)]));
  lines.push(
    toCsvRow([
      "PF利回り(%)",
      summary.portfolioYield != null
        ? summary.portfolioYield.toFixed(2)
        : null,
    ]),
  );
  lines.push(toCsvRow(["出力日", formatDate(new Date())]));
  lines.push("");

  // 2. 業種分散
  lines.push(toCsvRow(["■ 業種分散"]));
  lines.push(toCsvRow(["業種", "購入金額", "構成比(%)"]));
  for (const industry of industries) {
    lines.push(
      toCsvRow([
        industry.name,
        Math.round(industry.amount),
        industry.ratio.toFixed(1),
      ]),
    );
  }
  lines.push("");

  // 3. 保有予定銘柄
  lines.push(toCsvRow(["■ 保有予定銘柄"]));
  lines.push(toCsvRow(portfolioCsvHeaders));
  for (const stock of stocks) {
    const amount = purchaseAmount(stock);
    const dividend = annualDividend(stock);
    lines.push(
      toCsvRow([
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
      ]),
    );
  }

  downloadCsvText("配当びより_portfolio.csv", lines.join("\n"));
};
