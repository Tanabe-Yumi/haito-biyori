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

// 検索用の文字列正規化
// NFKC で全角英数字を半角に揃え (半角カナは全角に揃う)、小文字化する
// SQL 関数 normalize_search と検索入力の両方でこの関数を使い、比較の基準を一致させる
export function normalizeSearchText(text: string): string {
  return text.normalize("NFKC").toLowerCase();
}

// better-sqlite3 の生接続 (スクリプトなど生SQLを使う場面用)
export const sqlite = globalForDb.sqlite ?? createSqlite();
globalForDb.sqlite = sqlite;

// SQL から呼べる正規化関数を登録 (検索クエリで code/name の正規化に使う)
sqlite.function("normalize_search", { deterministic: true }, (text) =>
  typeof text === "string" ? normalizeSearchText(text) : null,
);

// Kysely インスタンス (アプリからのクエリはこちらを使う)
// 型定義 (src/types/db.ts) は実DBから自動生成: npm run db:codegen
export const db =
  globalForDb.kysely ??
  new Kysely<DB>({ dialect: new SqliteDialect({ database: sqlite }) });
globalForDb.kysely = db;
