import { UserCogIcon } from "lucide-react";

import AdminExecButton, {
  type AdminExecButtonProps,
  type AdminExecOption,
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
  options?: AdminExecButtonProps["options"];
};

// 中断した処理を残りの銘柄だけで再開するオプション
// (対象日はサーバー側で「今日」に解決される)
const RESUME_OPTION: AdminExecOption = {
  key: "resume",
  label: "未更新の銘柄のみ (今日更新済みの銘柄をスキップ)",
  value: "1",
};

// DB を更新せず差分の確認だけを行うオプション
const DRY_RUN_OPTION: AdminExecOption = {
  key: "dryRun",
  label: "確認のみ (差分を表示し、DBは更新しない)",
  value: "1",
};

const AdminPage = () => {
  const actions: Action[] = [
    {
      id: "sync-stocks",
      label: "銘柄リスト同期",
      script: "syncStockList.py",
      description:
        "JPX の上場銘柄一覧と照合し、新規上場の追加・上場廃止の対象外設定・社名や市場区分の変更を反映",
      notice: "銘柄リストが書き換わります",
      icon: "refresh",
      options: [DRY_RUN_OPTION],
    },
    {
      id: "fetch-stocks",
      label: "株価・配当利回り更新",
      script: "fetchStockPrices.py",
      description:
        "yfinanceから現在の株価を取得し、データベースの stocks テーブルを最新化",
      notice: "実行には数時間かかる場合があります",
      icon: "refresh",
      options: [RESUME_OPTION],
    },
    {
      id: "calc-scores",
      label: "スコア再計算",
      script: "calculateScores.py",
      description: "決算情報を元に各銘柄のスコアを再計算",
      notice: "実行には数十分かかる場合があります",
      icon: "refresh",
      options: [RESUME_OPTION],
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
            <CardContent>
              <AdminExecButton
                action={action.id}
                title={action.label}
                icon={action.icon}
                notice={action.notice}
                options={action.options}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
