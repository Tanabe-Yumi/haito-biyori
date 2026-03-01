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
  name: string;
  industry: string;
  market: string;
  price: number;
  dividend_yield: number;
}

async function importData() {
  const csvFilePath = path.join(__dirname, "../data/stocks.csv");
  const fileContent = fs.readFileSync(csvFilePath, "utf-8");

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`${records.length}件のレコードをインポートします...`);

  for (const rawRecord of records) {
    const record = rawRecord as CSVRecord;
    const importRecord: Database["public"]["Tables"]["stocks"]["Insert"] = {
      code: record.code,
      name: record.name,
      industry: parseInt(record.industry) || null,
      market: parseInt(record.market) || null,
      price: record.price || null,
      dividend_yield: record.dividend_yield || null,
    };

    // stocks に upsert
    const { error: historyError } = await supabase
      .from("stocks")
      .upsert(importRecord, { onConflict: "code" });

    if (historyError) {
      console.error(`${record.code} のインポートに失敗しました:`, historyError);
    } else {
      process.stdout.write(".");
    }
  }

  console.log("\nインポート完了！");
}

importData();
