import { AlertTriangleIcon, UserCogIcon } from "lucide-react";
import { SyncDataButton } from "@/components/SyncDataButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const AdminPage = () => {
  return (
    <div className="container mx-auto py-10 px-4 md:px-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <UserCogIcon className="w-8 h-8 text-primary" />
          管理者ページ
        </h1>
        <p className="text-muted-foreground">
          データの更新などが可能です。書き換えが発生するため、注意して実行してください。
        </p>
      </div>

      <div className="flex flex-col gap-y-6">
        {/* 株価・配当利回り更新 */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">
              株価・配当利回り更新 (fetchStockPrices.py)
            </CardTitle>
            <CardDescription>
              yfinanceから現在の株価を取得し、データベースの stocks
              テーブルを最新化
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h5 className="p-2 font-semibold tracking-tight flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-yellow-100/80 dark:bg-yellow-900/80 rounded-md">
              <AlertTriangleIcon className="w-4 h-4" />
              実行には数分かかる場合があります。
            </h5>
            <div className="flex justify-end">
              <SyncDataButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
