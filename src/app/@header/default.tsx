import Link from "next/link";
import { BarChart3, SunIcon } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-accent-foreground bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0 px-4 md:px-8">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <SunIcon className="h-6 w-6 stroke-amber-400 fill-amber-400" />
            <span className="inline-block font-bold text-xl tracking-tight">
              配当<span className="text-amber-500">びより</span>
            </span>
          </Link>
          <nav className="flex gap-6">
            <Link
              href="/"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              銘柄一覧
            </Link>

            {/* TODO: お気に入りリスト */}

            {/* TODO: 保有銘柄ページ */}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
