"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { pages } from "@/constants/page";
import { useListHref } from "@/hooks/use-list-href";

// ナビゲーションの表示部分
// listHref: 銘柄一覧リンクの遷移先 (現在の検索条件を保持した URL)
export function HeaderNavigationView({ listHref = "/" }: { listHref?: string }) {
  // 銘柄一覧 ("/") だけ検索条件付きの href に差し替える
  const hrefOf = (href: string) => (href === "/" ? listHref : href);

  return (
    <>
      {/* sm 以上ではナビゲーションをインライン表示 */}
      <nav className="hidden sm:flex gap-6">
        {pages.map((p) => (
          <Link
            key={p.label}
            href={hrefOf(p.href)}
            className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <p.icon className="mr-2 h-4 w-4" />
            {p.label}
          </Link>
        ))}
      </nav>

      {/* sm 未満ではハンバーガーメニューに集約 */}
      <div className="sm:hidden ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="メニューを開く">
              <MenuIcon className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {pages.map((p) => (
              <DropdownMenuItem key={p.label} asChild>
                <Link href={hrefOf(p.href)}>
                  <p.icon className="size-4" />
                  {p.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

// 現在の検索条件を反映したナビゲーション
// (useSearchParams を使うため、呼び出し側で Suspense に包む)
export function HeaderNavigation() {
  const listHref = useListHref();
  return <HeaderNavigationView listHref={listHref} />;
}
