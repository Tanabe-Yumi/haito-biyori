import { PortfolioStock } from "@/types/portfolio";

// 銘柄ごとの購入金額 (現在値 × 株数)
// 株価が未取得 (null) の場合は null を返し、集計から除外できるようにする
export function purchaseAmount(stock: PortfolioStock): number | null {
  return stock.price != null ? stock.price * stock.shares : null;
}

// 銘柄ごとの年間配当 (税引前)
export function annualDividend(stock: PortfolioStock): number | null {
  const amount = purchaseAmount(stock);
  return amount != null && stock.dividendYield != null
    ? (amount * stock.dividendYield) / 100
    : null;
}

// ポートフォリオ全体の集計
export interface PortfolioSummary {
  // 銘柄数
  stockCount: number;
  // 業種数
  industryCount: number;
  // 購入金額の合計
  totalAmount: number;
  // 年間配当 (税引前) の合計
  totalDividend: number;
  // ポートフォリオ全体の配当利回り (%)。加重平均になる
  portfolioYield: number | null;
}

export function summarizePortfolio(stocks: PortfolioStock[]): PortfolioSummary {
  const totalAmount = stocks.reduce(
    (sum, s) => sum + (purchaseAmount(s) ?? 0),
    0,
  );
  const totalDividend = stocks.reduce(
    (sum, s) => sum + (annualDividend(s) ?? 0),
    0,
  );

  return {
    stockCount: stocks.length,
    industryCount: new Set(stocks.map((s) => s.industry).filter((i) => i != null))
      .size,
    totalAmount,
    totalDividend,
    portfolioYield:
      totalAmount !== 0 ? (totalDividend / totalAmount) * 100 : null,
  };
}

// 業種ごとの内訳
export interface IndustryBreakdownItem {
  name: string;
  // 購入金額の合計
  amount: number;
  // 構成比 (%)
  ratio: number;
}

// 業種ごとの購入金額を集計し、構成比の降順で返す
// 株価が未取得・株数0の銘柄は集計から除外する
export function breakdownByIndustry(
  stocks: PortfolioStock[],
): IndustryBreakdownItem[] {
  const amounts = new Map<string, number>();
  for (const stock of stocks) {
    const amount = purchaseAmount(stock);
    if (amount == null || stock.shares === 0) {
      continue;
    }
    const industry = stock.industry ?? "未分類";
    amounts.set(industry, (amounts.get(industry) ?? 0) + amount);
  }

  const totalAmount = [...amounts.values()].reduce((sum, v) => sum + v, 0);
  if (totalAmount === 0) {
    return [];
  }

  return [...amounts.entries()]
    .map(([name, amount]) => ({
      name,
      amount,
      ratio: (amount / totalAmount) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);
}
