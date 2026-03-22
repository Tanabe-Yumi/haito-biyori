import { BarChart3, UserCogIcon } from "lucide-react";

export const pages = [
  { href: "/", label: "銘柄一覧", icon: BarChart3 },
  { href: "/admin", label: "管理者ページ", icon: UserCogIcon },
  // TODO: お気に入りリスト
  // TODO: 保有銘柄ページ
] as const;
