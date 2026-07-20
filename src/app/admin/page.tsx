import { UserCogIcon } from "lucide-react";

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
  withResumeOption?: boolean;
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
      // 中断からの再開用オプションを表示する
      withResumeOption: true,
    },
    {
      id: "calc-scores",
      label: "スコア再計算",
      script: "calculateScores.py",
      description: "決算情報を元に各銘柄のスコアを再計算",
      notice: "実行には数十分かかる場合があります",
      icon: "refresh",
      // 中断からの再開用オプションを表示する
      withResumeOption: true,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserCogIcon className="text-emerald-600 size-6" />
          管理者ページ
        </h1>
        <p className="text-muted-foreground text-sm">
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
            <CardContent>
              <AdminExecButton
                action={action.id}
                title={action.label}
                icon={action.icon}
                notice={action.notice}
                withResumeOption={action.withResumeOption}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
