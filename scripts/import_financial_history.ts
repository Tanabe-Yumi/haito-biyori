import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import dotenv from "dotenv";
import { Database } from "@/types/database.types";

// 環境変数読み込み
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use Service Role Key if available (for scripts/admin), otherwise Anon Key
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    ".env.local に Supabase の URL または Key が設定されていません。",
  );
  process.exit(1);
}

console.log(
  `使用する認証情報: ${supabaseUrl} (Key length: ${supabaseKey.length})`,
);

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

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

async function importData() {
  const csvFilePath = path.join(__dirname, "../data/financial_history.csv");
  const fileContent = fs.readFileSync(csvFilePath, "utf-8");

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`${records.length}件のレコードをインポートします...`);

  for (const rawRecord of records) {
    const record = rawRecord as CSVRecord;
    // financial_history に upsert
    const { error: historyError } = await supabase
      .from("financial_history")
      .upsert(
        {
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
        },
        { onConflict: "code,year,month" },
      );

    if (historyError) {
      console.error(
        `${record.code}/${record.year}/${record.month} のインポートに失敗しました:`,
        historyError,
      );
    } else {
      process.stdout.write(".");
    }
  }

  console.log("\nインポート完了！");
}

importData();
