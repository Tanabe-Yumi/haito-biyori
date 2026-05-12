import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import dotenv from "dotenv";
import { Database } from "../src/types/database.types";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(".env.local に Supabase の URL または Key が設定されていません。");
  process.exit(1);
}

console.log(`使用する認証情報: ${supabaseUrl} (Key length: ${supabaseKey.length})`);

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

interface CSVRecord {
  code: string;
  year: string;
  month: string;
  operating_profit: string;
}

async function updateOperatingProfit() {
  const csvFilePath = path.join(__dirname, "../data/operating_profit.csv");
  const fileContent = fs.readFileSync(csvFilePath, "utf-8");

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  }) as CSVRecord[];

  console.log(`${records.length}件のレコードを更新します...`);

  let successCount = 0;
  let errorCount = 0;

  for (const record of records) {
    const operatingProfit = record.operating_profit !== "" ? parseFloat(record.operating_profit) : null;

    const { error } = await supabase
      .from("financial_history")
      .update({ operating_profit: operatingProfit })
      .eq("code", record.code)
      .eq("year", parseInt(record.year))
      .eq("month", parseInt(record.month));

    if (error) {
      console.error(`\n${record.code}/${record.year}/${record.month} の更新に失敗しました:`, error);
      errorCount++;
    } else {
      process.stdout.write(".");
      successCount++;
    }
  }

  console.log(`\n完了: 成功 ${successCount}件 / 失敗 ${errorCount}件`);
}

updateOperatingProfit();
