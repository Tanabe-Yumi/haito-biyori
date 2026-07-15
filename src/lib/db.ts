import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { Kysely, SqliteDialect } from "kysely";
import { DB } from "@/types/db";

// SQLite の DB ファイルパス
// 環境変数 SQLITE_DB_PATH で上書き可能
const dbPath =
  process.env.SQLITE_DB_PATH ||
  path.join(process.cwd(), "data", "haito-biyori.db");

// スキーマ定義ファイル
const schemaPath = path.join(process.cwd(), "db", "schema.sql");

// Next.js の開発時ホットリロードで接続が増殖しないよう globalThis にキャッシュ
const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
  kysely?: Kysely<DB>;
};

function createSqlite(): Database.Database {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // スキーマは create if not exists / insert or ignore のみで構成されているため、
  // 起動のたびに適用してもよい (初回起動時に自動でテーブルが作られる)
  db.exec(fs.readFileSync(schemaPath, "utf-8"));

  return db;
}

// better-sqlite3 の生接続 (スクリプトなど生SQLを使う場面用)
export const sqlite = globalForDb.sqlite ?? createSqlite();
globalForDb.sqlite = sqlite;

// Kysely インスタンス (アプリからのクエリはこちらを使う)
// 型定義 (src/types/db.ts) は実DBから自動生成: npm run db:codegen
export const db =
  globalForDb.kysely ??
  new Kysely<DB>({ dialect: new SqliteDialect({ database: sqlite }) });
globalForDb.kysely = db;
