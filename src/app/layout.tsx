import type { Metadata } from "next";
import { Geist, Geist_Mono, M_PLUS_1p } from "next/font/google";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { Loader } from "@/components/layout/Loader";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const mPlus1p = M_PLUS_1p({
  weight: "400",
  style: "normal",
  subsets: ["latin"],
  variable: "--font-m-plus-1p",
});

export const metadata: Metadata = {
  // canonical などの相対 URL の解決基準
  // 公開時は NEXT_PUBLIC_SITE_URL に本番 URL を設定する
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    template: "%s | 配当びより",
    default: "配当びより",
  },
  description: "日本の高配当株投資をサポート",
};

export default function RootLayout({
  children,
  header,
  footer,
}: Readonly<{
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={cn(
          // min-h-dvh: モバイルのアドレスバーを考慮した実表示領域の高さ
          // (100vh だとアドレスバー分の差でスクロールが出る)
          "min-h-dvh bg-background antialiased flex flex-col",
          geistSans.variable,
          geistMono.variable,
          mPlus1p.className,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NuqsAdapter>
            {header}
            <Suspense fallback={<Loader label="読み込み中..." />}>
              <main className="container mx-auto py-6 px-4 md:px-8 flex-1">
                {children}
              </main>
            </Suspense>
            {footer}
          </NuqsAdapter>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
