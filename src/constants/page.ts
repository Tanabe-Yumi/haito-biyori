import { BarChart3, UserCogIcon, WalletIcon } from "lucide-react";

export const pages = [
  { href: "/", label: "銘柄一覧", icon: BarChart3 },
  { href: "/portfolio", label: "ポートフォリオ", icon: WalletIcon },
  { href: "/admin", label: "管理者ページ", icon: UserCogIcon },
] as const;
