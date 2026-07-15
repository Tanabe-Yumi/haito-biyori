import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { db } from "../src/lib/db";

interface CSVRecord {
  code: string;
  name: string;
  industry: string;
  market: string;
  price: number;
  dividend_yield: number;
}

function importData() {
  const csvFilePath = path.join(__dirname, "../data/stocks.csv");
  const fileContent = fs.readFileSync(csvFilePath, "utf-8");

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`${records.length}件のレコードをインポートします...`);

  // stocks に upsert
  const upsert = db.prepare(`
    insert into stocks (code, name, industry, market, price, dividend_yield)
    values (@code, @name, @industry, @market, @price, @dividend_yield)
    on conflict (code) do update set
      name           = excluded.name,
      industry       = excluded.industry,
      market         = excluded.market,
      price          = excluded.price,
      dividend_yield = excluded.dividend_yield
  `);

  for (const rawRecord of records) {
    const record = rawRecord as CSVRecord;

    try {
      upsert.run({
        code: record.code,
        name: record.name,
        industry: parseInt(record.industry) || null,
        market: parseInt(record.market) || null,
        price: record.price || null,
        dividend_yield: record.dividend_yield || null,
      });
      process.stdout.write(".");
    } catch (error) {
      console.error(`${record.code} のインポートに失敗しました:`, error);
    }
  }

  console.log("\nインポート完了！");
}

importData();
