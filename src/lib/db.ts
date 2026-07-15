import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// SQLite の DB ファイルパス
// 環境変数 SQLITE_DB_PATH で上書き可能
const dbPath =
  process.env.SQLITE_DB_PATH ||
  path.join(process.cwd(), "data", "haito-biyori.db");

// スキーマ定義ファイル
const schemaPath = path.join(process.cwd(), "db", "schema.sql");

// Next.js の開発時ホットリロードで接続が増殖しないよう globalThis にキャッシュ
const globalForDb = globalThis as unknown as { sqlite?: Database.Database };

function createDb(): Database.Database {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // スキーマは create if not exists / insert or ignore のみで構成されているため、
  // 起動のたびに適用してもよい (初回起動時に自動でテーブルが作られる)
  db.exec(fs.readFileSync(schemaPath, "utf-8"));

  return db;
}

export const db = globalForDb.sqlite ?? createDb();
globalForDb.sqlite = db;
