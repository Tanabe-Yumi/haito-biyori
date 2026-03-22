"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  XCircle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  RefreshCwIcon,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function SyncDataButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<
    "idle" | "running" | "completed" | "error" | "cancelled"
  >("idle");

  const abortControllerRef = useRef<AbortController | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // オートスクロール
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleStartSync = async () => {
    setIsSyncing(true);
    setStatus("running");
    setProgress(0);
    setTotal(0);
    setStatusMessage("同期を準備中...");
    setLogs([]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/exec", {
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) throw new Error("Response body is null");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // SSEのデータ形式 'data: {...}\n\n' に従ってパース
        const parts = buffer.split("\n\n");
        // 最後の一つは不完全かもしれないので残す
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (part.startsWith("data: ")) {
            const jsonStr = part.substring(6);
            try {
              const data = JSON.parse(jsonStr);

              if (data.type === "progress") {
                setTotal(data.total);
                setProgress(
                  data.total > 0 ? (data.current / data.total) * 100 : 0,
                );
                setStatusMessage(
                  `${data.current} / ${data.total} : ${data.message}`,
                );
              } else if (data.type === "info") {
                setStatusMessage(data.message);
                setLogs((prev) => [...prev, data.message]);
              } else if (data.type === "summary") {
                setLogs((prev) => [...prev, `=== 結果 ===`, data.message]);
              } else if (data.type === "complete") {
                setStatus("completed");
                setIsSyncing(false);
                setStatusMessage(data.message);
              } else if (data.type === "cancelled") {
                setStatus("cancelled");
                setIsSyncing(false);
                setStatusMessage(data.message);
              } else if (data.type === "error") {
                setStatus("error");
                setIsSyncing(false);
                setStatusMessage("エラーが発生しました: " + data.message);
                setLogs((prev) => [...prev, `[ERROR] ${data.message}`]);
              } else if (data.type === "log") {
                setLogs((prev) => [...prev, data.message]);
              } else if (data.type === "errorLog") {
                setLogs((prev) => [...prev, `[エラー] ${data.message}`]);
              }
            } catch (e) {
              console.error("JSON parse error:", e, jsonStr);
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatus("cancelled");
        setStatusMessage("ユーザーによってキャンセルされました。");
      } else {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setStatus("error");
        setStatusMessage(`通信エラーが発生しました: ${errorMessage}`);
        setLogs((prev) => [...prev, `[SYSTEM COM ERROR] ${errorMessage}`]);
      }
      setIsSyncing(false);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleClose = () => {
    if (isSyncing) return;
    setStatus("idle");
    setLogs([]);
  };

  return (
    <>
      <Button
        onClick={handleStartSync}
        variant="default"
        className="w-full sm:w-auto flex items-center gap-2 font-semibold bg-transparent text-emerald-600 border border-emerald-600 hover:bg-muted"
      >
        <RefreshCwIcon className="w-4 h-4" />
        株価・配当利回り更新
      </Button>

      {/* モーダルオーバーレイ */}
      {(isSyncing || status !== "idle") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-lg p-6 flex flex-col gap-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {isSyncing ? (
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                ) : status === "completed" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : status === "error" ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
                データ更新
              </h3>
            </div>

            {/* 本文 */}
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground truncate max-w-[80%]">
                  {statusMessage}
                </span>
                {total > 0 && (
                  <span className="font-mono">{Math.round(progress)}%</span>
                )}
              </div>

              {/* プログレスバー */}
              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    status === "error" || status === "cancelled"
                      ? "bg-red-500/50"
                      : "bg-blue-600",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* ログビューア */}
              {logs.length > 0 && (
                <div className="bg-muted min-h-25 max-h-37.5 overflow-y-auto rounded-md p-3 text-xs font-mono whitespace-pre-wrap">
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className={
                        log.includes("[エラー]") || log.includes("ERROR")
                          ? "text-red-400"
                          : "text-muted-foreground"
                      }
                    >
                      {log}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>

            {/* アクションボタン */}
            <div className="flex justify-end gap-3 mt-2">
              {isSyncing ? (
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  キャンセル
                </Button>
              ) : (
                <Button variant="default" onClick={handleClose}>
                  閉じる
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
