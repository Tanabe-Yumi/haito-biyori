import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { db } from "../src/lib/db";

interface CSVRecord {
  code: string;
  year: string;
  month: string;
  operating_profit: string;
}

function updateOperatingProfit() {
  const csvFilePath = path.join(__dirname, "../data/operating_profit.csv");
  const fileContent = fs.readFileSync(csvFilePath, "utf-8");

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  }) as CSVRecord[];

  console.log(`${records.length}件のレコードを更新します...`);

  const update = db.prepare(`
    update financial_history
      set operating_profit = @operating_profit
      where code = @code and year = @year and month = @month
  `);

  let successCount = 0;
  let errorCount = 0;

  for (const record of records) {
    const operatingProfit =
      record.operating_profit !== ""
        ? parseFloat(record.operating_profit)
        : null;

    try {
      update.run({
        code: record.code,
        year: parseInt(record.year),
        month: parseInt(record.month),
        operating_profit: operatingProfit,
      });
      process.stdout.write(".");
      successCount++;
    } catch (error) {
      console.error(
        `\n${record.code}/${record.year}/${record.month} の更新に失敗しました:`,
        error,
      );
      errorCount++;
    }
  }

  console.log(`\n完了: 成功 ${successCount}件 / 失敗 ${errorCount}件`);
}

updateOperatingProfit();
