import { AlertTriangleIcon, UserCogIcon } from "lucide-react";

import AdminExecButton, {
  type AdminExecButtonProps,
} from "@/components/AdminExecButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Action = {
  id: AdminExecButtonProps["action"];
  label: string;
  script: string | null;
  description: string | null;
  notice: string | null;
  icon: AdminExecButtonProps["icon"];
};

const AdminPage = () => {
  const actions: Action[] = [
    {
      id: "fetch-stocks",
      label: "株価・配当利回り更新",
      script: "fetchStockPrices.py",
      description:
        "yfinanceから現在の株価を取得し、データベースの stocks テーブルを最新化",
      notice: "実行には数時間かかる場合があります",
      icon: "refresh",
    },
    {
      id: "calc-scores",
      label: "スコア再計算",
      script: "calculateScores.py",
      description: "決算情報を元に各銘柄のスコアを再計算",
      notice: "実行には数十分かかる場合があります",
      icon: "refresh",
    },
  ];

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
        {actions.map((action) => (
          <Card key={action.id} className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">
                {action.label}
                {action.script && ` (${action.script})`}
              </CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {action.notice ? (
                <h5 className="px-4 py-2 font-semibold tracking-tight flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-yellow-100/80 dark:bg-yellow-900/80 rounded-md">
                  <AlertTriangleIcon className="w-4 h-4" />
                  {action.notice}
                </h5>
              ) : (
                <h5></h5>
              )}
              <div className="flex justify-end">
                <AdminExecButton
                  action={action.id}
                  title={action.label}
                  icon={action.icon}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
