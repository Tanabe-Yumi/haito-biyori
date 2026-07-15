import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { db } from "../src/lib/db";

interface CSVRecord {
  code: string;
  year: string;
  month: string;
  sales: string;
  operating_profit_margin: string;
  earnings_per_share: string;
  operating_cash_flow: string;
  dividend_per_share: string;
  payout_ratio: string;
  equity_ratio: string;
  cash: string;
  operating_profit: string;
}

function importData() {
  const csvFilePath = path.join(__dirname, "../data/financial_history.csv");
  const fileContent = fs.readFileSync(csvFilePath, "utf-8");

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`${records.length}件のレコードをインポートします...`);

  // financial_history に upsert
  const upsert = db.prepare(`
    insert into financial_history (
      code, year, month, sales, operating_profit_margin, earnings_per_share,
      operating_cash_flow, dividend_per_share, payout_ratio, equity_ratio,
      cash, operating_profit
    )
    values (
      @code, @year, @month, @sales, @operating_profit_margin, @earnings_per_share,
      @operating_cash_flow, @dividend_per_share, @payout_ratio, @equity_ratio,
      @cash, @operating_profit
    )
    on conflict (code, year, month) do update set
      sales                   = excluded.sales,
      operating_profit_margin = excluded.operating_profit_margin,
      earnings_per_share      = excluded.earnings_per_share,
      operating_cash_flow     = excluded.operating_cash_flow,
      dividend_per_share      = excluded.dividend_per_share,
      payout_ratio            = excluded.payout_ratio,
      equity_ratio            = excluded.equity_ratio,
      cash                    = excluded.cash,
      operating_profit        = excluded.operating_profit
  `);

  for (const rawRecord of records) {
    const record = rawRecord as CSVRecord;

    try {
      upsert.run({
        code: record.code,
        year: parseInt(record.year),
        month: parseInt(record.month),
        sales: parseFloat(record.sales) || null,
        operating_profit_margin:
          parseFloat(record.operating_profit_margin) || null,
        earnings_per_share: parseFloat(record.earnings_per_share) || null,
        operating_cash_flow: parseFloat(record.operating_cash_flow) || null,
        dividend_per_share: parseFloat(record.dividend_per_share) || null,
        payout_ratio: parseFloat(record.payout_ratio) || null,
        equity_ratio: parseFloat(record.equity_ratio) || null,
        cash: parseFloat(record.cash) || null,
        operating_profit: parseFloat(record.operating_profit) || null,
      });
      process.stdout.write(".");
    } catch (error) {
      console.error(
        `${record.code}/${record.year}/${record.month} のインポートに失敗しました:`,
        error,
      );
    }
  }

  console.log("\nインポート完了！");
}

importData();
