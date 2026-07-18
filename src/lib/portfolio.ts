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
