"use client";

import { useState } from "react";
import { MinusCircleIcon, RefreshCwIcon, XCircleIcon } from "lucide-react";

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
import { Progress } from "@/components/ui/progress";

const icons = {
  refresh: RefreshCwIcon,
};

export interface AdminExecButtonProps {
  action: "fetch-stocks" | "calc-scores";
  title: string;
  icon: keyof typeof icons;
}

const AdminExecButton = ({ action, title, icon }: AdminExecButtonProps) => {
  const endpoint = "/api/exec/" + action;
  const Icon = icons[icon];
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState("準備中...");
  const [isExecuting, setIsExecuting] = useState(false);

  const resetStates = () => {
    setProgress(0);
    setLogs([]);
    setStatusMessage("準備中...");
  };

  const handleRefresh = async () => {
    resetStates();
    setIsExecuting(true);

    const decoder = new TextDecoder();
    const res = await fetch(endpoint);
    // サーバーのデータをリアルタイムかつ継続的に受け取り
    const reader = res.body?.getReader();
    if (!reader) return;

    while (true) {
      // 次のデータが届くまで待機し、届いたら値を取り出す
      const { done, value } = await reader.read();

      // データストリーム完了時
      if (done) {
        console.log("DONE");
        setIsExecuting(false);
        break;
      }

      // データの加工
      // バイナリをテキストに変換
      const chunk = decoder.decode(value);

      // SSE のルールを削除
      const jsonString = chunk.replace(/^data: /, "").trim();

      // JSON からデータを取り出す
      if (jsonString) {
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
        } catch (e) {
          console.error("パース失敗: ", jsonString);
        }
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
  );
};

export default AdminExecButton;
