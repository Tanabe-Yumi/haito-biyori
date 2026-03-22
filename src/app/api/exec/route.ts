import { NextRequest } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

// child_process: Node.js で子プロセスを生成し、メインプロセスから独立して実行する

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  // ReadableStream: バイトデータの読み取り可能なストリーム
  // - クライアント側からは fetch によりレスポンスを取得できる
  const customReadable = new ReadableStream({
    start(controller) {
      // Python パスを設定
      const pjRootPath = process.cwd();
      const pythonPath = path.join(pjRootPath, "python");
      const venvPythonPath = path.join(pythonPath, "venv", "bin", "python");
      let pythonExecutable = "python3";
      // 実行スクリプト
      const scriptPath = path.join(pythonPath, "fetchStockPrices.py");

      // venc があれば使用
      if (fs.existsSync(venvPythonPath)) {
        pythonExecutable = venvPythonPath;
      } else {
        try {
          const pythonFallback = path.join(pythonPath, "venv", "bin", "python");
          if (fs.existsSync(pythonFallback)) {
            pythonExecutable = pythonFallback;
          }
        } catch (_) {}
      }

      // stream に文字列を追加
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "info", message: "データベース同期を開始します..." })}\n\n`,
        ),
      );

      const child = spawn(pythonExecutable, [scriptPath], {
        cwd: pythonPath,
        env: {
          ...process.env,
          // 標準出力をバッファリングしないように設定
          PYTHONUNBUFFERED: "1",
        },
      });

      // クライアント切断処理
      req.signal.addEventListener("abort", () => {
        console.log("Client terminated connection. Killing python process...");
        child.kill("SIGTERM");
      });

      child.stdout.on("data", (data) => {
        const lines = data.toString().split("\n");
        for (const line of lines) {
          if (!line.trim()) continue;

          let parsedData: {
            type: string;
            message?: string;
            current?: number;
            total?: number;
          } = { type: "log", message: line };

          // 進捗をストリームに追加
          // 例) [INFO] [1/200] 処理中: 日本電信電話 (9432)
          const progressMatch = line.match(/\[(\d+)\/(\d+)\]\s+処理中:\s+(.+)/);
          if (progressMatch) {
            parsedData = {
              type: "progress",
              current: parseInt(progressMatch[1], 10),
              total: parseInt(progressMatch[2], 10),
              message: progressMatch[3].trim(),
            };
          } else if (line.includes("成功:") && line.includes("エラー:")) {
            parsedData = { type: "summary", message: line.trim() };
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(parsedData)}\n\n`),
          );
        }
      });

      child.stderr.on("data", (data) => {
        const lines = data.toString().split("\n");
        for (const line of lines) {
          if (!line.trim()) continue;

          // Exception や [ERROR] といった文字列が含まれる場合はエラーとして扱う
          const isError =
            line.includes("[ERROR]") ||
            line.includes("[エラー]") ||
            line.includes("Traceback") ||
            line.toLowerCase().includes("exception") ||
            line.includes("Error");

          if (isError) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "errorLog", message: line })}\n\n`,
              ),
            );
          } else {
            // INFO等の通常ログは log として送信
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "log", message: line })}\n\n`,
              ),
            );
          }
        }
      });

      child.on("close", (code) => {
        if (code === 0) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "complete", message: "処理が完了しました" })}\n\n`,
            ),
          );
        } else if (code === null) {
          // プロセスがkillされた場合 (キャンセル等)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "cancelled", message: "処理がキャンセルされました" })}\n\n`,
            ),
          );
        } else {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: `プロセスが終了コード ${code} で異常終了しました` })}\n\n`,
            ),
          );
        }
        controller.close();
      });

      child.on("error", (err) => {
        console.error("Failed to start subprocess.", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: `プロセスの起動に失敗しました: ${err.message}` })}\n\n`,
          ),
        );
        controller.close();
      });
    },
  });

  return new Response(customReadable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
