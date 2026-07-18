import Link from "next/link";
import { Suspense } from "react";
import { SunIcon } from "lucide-react";

import {
  HeaderNavigation,
  HeaderNavigationView,
} from "@/components/HeaderNavigation";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-accent-foreground bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center gap-6 md:gap-10 px-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <SunIcon className="h-6 w-6 stroke-amber-400 fill-amber-400" />
          <span className="inline-block font-bold text-xl tracking-tight">
            配当<span className="text-amber-500">びより</span>
          </span>
        </Link>

        {/* ナビゲーション
            銘柄一覧リンクは現在の検索条件を保持する (useSearchParams を使うため Suspense で包む) */}
        <Suspense fallback={<HeaderNavigationView />}>
          <HeaderNavigation />
        </Suspense>
      </div>
    </header>
  );
};

export default Header;
