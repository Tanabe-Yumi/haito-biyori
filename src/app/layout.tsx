import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
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

export const metadata: Metadata = {
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
    <html lang="ja">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased flex flex-col",
          geistSans.variable,
          geistMono.variable,
        )}
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
      </body>
    </html>
  );
}
