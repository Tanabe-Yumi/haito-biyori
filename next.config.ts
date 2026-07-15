import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 はネイティブモジュールのためバンドル対象から除外する
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
