import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { Header } from "@/components/layout/Header";
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
  title: "High Dividend Stock Analysis",
  description: "Japanese High Dividend Stock Grading App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <NuqsAdapter>
          <Header />
          <Suspense fallback={<Loader label="読み込み中..." />}>
            <main className="container mx-auto py-6 px-4 md:px-8">
              {children}
            </main>
          </Suspense>
        </NuqsAdapter>
      </body>
    </html>
  );
}
