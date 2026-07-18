"use client";

import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const ErrorPage = ({ error }: { error: Error & { digest?: string } }) => {
  return (
    // 通常のフロー内で上から配置し、上部に余白を広めに取る
    <div className="flex flex-col items-center gap-6 pt-24 sm:pt-32">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-rose-100 p-3 rounded-full">
            <AlertTriangleIcon className="size-10 text-rose-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            問題が発生しました
          </h2>
          <p>{error.message}</p>
        </div>
      </div>
      {/* エラー境界の表示中はクライアントサイド遷移で復帰できないことがあるため、
          Link ではなく a タグであえてフルページロードし、状態をリセットする */}
      <Button asChild className="font-medium">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/">トップページへ戻る</a>
      </Button>
    </div>
  );
};

export default ErrorPage;
