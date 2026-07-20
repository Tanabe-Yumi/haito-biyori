"use client";

import { useState } from "react";
import {
  AlertTriangleIcon,
  MinusCircleIcon,
  RefreshCwIcon,
  XCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

// TODO: 処理実行中もモーダル閉じて別操作できるように改善
//       - モーダルを閉じても Python は続行
//       - 履歴管理が必要

const icons = {
  refresh: RefreshCwIcon,
};

export interface AdminExecButtonProps {
  action: "fetch-stocks" | "calc-scores";
  title: string;
  icon: keyof typeof icons;
  // 注意書き (カード左側に表示)
  notice?: string | null;
  // 「未更新の銘柄のみ」オプションを表示するか
  withResumeOption?: boolean;
}

const AdminExecButton = ({
  action,
  title,
  icon,
  notice = null,
  withResumeOption = false,
}: AdminExecButtonProps) => {
  const endpoint = "/api/exec/" + action;
  const Icon = icons[icon];
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState("準備中...");
  const [isExecuting, setIsExecuting] = useState(false);
  // 未更新の銘柄のみを対象にするか
  const [resumeOnly, setResumeOnly] = useState(false);

  const resetStates = () => {
    setProgress(0);
    setLogs([]);
    setStatusMessage("準備中...");
  };

  const handleRefresh = async () => {
    resetStates();
    setIsExecuting(true);

    // 「未更新の銘柄のみ」の場合、今日 (UTC) より前に更新された銘柄だけを対象にする
    // (updated_at は UTC で保存されているため、日付も UTC 基準で渡す)
    const today = new Date().toISOString().slice(0, 10);
    const url =
      withResumeOption && resumeOnly
        ? `${endpoint}?updatedBefore=${today}`
        : endpoint;

    const decoder = new TextDecoder();
    const res = await fetch(url);
    // サーバーのデータをリアルタイムかつ継続的に受け取り
    const reader = res.body?.getReader();
    if (!reader) return;

    // 受信バッファ
    // 1チャンクに複数イベントが詰まる / イベントがチャンク境界で分断されることがあるため、
    // バッファに溜めて、完成したイベント (\n\n 区切り) だけを処理する
    let buffer = "";

    // 1イベント分の JSON を処理する
    const handleEvent = (event: string) => {
      // SSE のルール (data: プレフィックス) を削除
      const jsonString = event.replace(/^data: /, "").trim();
      if (!jsonString) {
        return;
      }

      // JSON からデータを取り出す
      try {
        const dataObj = JSON.parse(jsonString);
        console.log(dataObj);

        switch (dataObj.type) {
          // ダイアログタイトルの下に表示
          case "status":
            setStatusMessage(dataObj.message);
            break;
          // 進捗。ダイアログタイトルの下に表示
          case "progress":
            setStatusMessage(
              `処理中(${dataObj.current} / ${dataObj.total}): ${dataObj.code} ${dataObj.name}`,
            );
            setProgress((dataObj.current / dataObj.total) * 100);
            break;
          // プログレスバー下のスクロールエリアに表示
          case "log":
            setLogs((prev) => [dataObj.message, ...prev]);
            break;
        }
      } catch {
        console.error("パース失敗: ", jsonString);
      }
    };

    while (true) {
      // 次のデータが届くまで待機し、届いたら値を取り出す
      const { done, value } = await reader.read();

      // データストリーム完了時
      if (done) {
        // バッファに残った最後のイベントを処理
        handleEvent(buffer);
        console.log("DONE");
        setIsExecuting(false);
        break;
      }

      // バイナリをテキストに変換
      // stream: true でマルチバイト文字のチャンク境界の分断に対応
      buffer += decoder.decode(value, { stream: true });

      // 完成したイベントだけを処理する (末尾の要素は未完の可能性があるためバッファに残す)
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const event of events) {
        handleEvent(event);
      }
    }
  };

  const handleCancel = async () => {
    setIsExecuting(false);
    await fetch(endpoint, {
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => console.log(data));
  };

  return (
    <div className="flex w-full flex-col md:flex-row justify-between items-start md:items-center gap-4">
      {/* 左側: 注意書きとオプション */}
      <div className="flex flex-col items-start gap-3">
        {notice && (
          <h5 className="px-4 py-2 font-semibold tracking-tight flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-yellow-100/80 dark:bg-yellow-900/80 rounded-md">
            <AlertTriangleIcon className="w-4 h-4" />
            {notice}
          </h5>
        )}
        {/* 未更新の銘柄だけを対象にするオプション (実行前に選ぶ) */}
        {withResumeOption && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Checkbox
              checked={resumeOnly}
              onCheckedChange={(checked) => setResumeOnly(checked === true)}
            />
            未更新の銘柄のみ (今日更新済みの銘柄をスキップ)
          </label>
        )}
      </div>

      {/* 右側: 実行ボタン */}
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="default"
          className="w-full sm:w-auto flex items-center gap-2 font-semibold bg-transparent text-emerald-600 border border-emerald-600 hover:bg-muted"
          onClick={handleRefresh}
        >
          <Icon className="w-4 h-4" />
          {title}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="flex flex-col justify-center items-start gap-3">
          <div className="">{statusMessage}</div>
          <Progress value={progress} className="bg-emerald-600" />
          <div className="w-full h-32 text-sm overflow-y-auto no-scrollbar p-2 text-muted-foreground bg-muted rounded-sm">
            {logs.map((l, id) => (
              <p key={id}>{l}</p>
            ))}
          </div>
        </div>
        <AlertDialogFooter>
          {isExecuting ? (
            <Button
              type="button"
              variant="default"
              onClick={handleCancel}
              className="sm:w-auto font-semibold bg-transparent text-emerald-600 border border-emerald-600 hover:bg-muted"
            >
              <XCircleIcon />
              キャンセル
            </Button>
          ) : (
            <AlertDialogCancel className="sm:w-auto font-semibold text-emerald-600 border-emerald-600 hover:bg-muted hover:text-emerald-600">
              <MinusCircleIcon />
              閉じる
            </AlertDialogCancel>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
  );
};

export default AdminExecButton;
