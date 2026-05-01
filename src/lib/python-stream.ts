import { NextResponse } from "next/server";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import path from "path";

// createPythonStreamHandler
// - Python スクリプトを子プロセスとして起動し
//   標準出力を SSE (Server-Sent Events) ストリームとしてフロントに流す
// - 引数: 実行する Python スクリプトのファイル名 (python/ 配下)
// - 戻り値: { createStream, cancel }
//   - createStream: GET ハンドラで呼び出す。SSE ストリームを返す
//   - cancel: POST ハンドラで呼び出す。実行中のプロセスに SIGINT を送る
// - ファクトリ関数にすることで、スクリプトごとに独立した childProcess をクロージャで保持
//   異なるスクリプトのキャンセルが干渉しない
//   - ファクトリ関数: new やクラスを使わずにオブジェクトを生成して返す関数。カプセル化

// route.ts での使い方:
//   const handler = createPythonStreamHandler("fetchStockPrices.py");
//   export async function GET() { return sseResponse(handler.createStream()); }
//   export async function POST() { handler.cancel(); ... }

export function createPythonStreamHandler(scriptName: string) {
  // python を実行するプロセス
  // - フロントのキャンセルボタンから停止するため createStream 関数外で定義
  let childProcess: ChildProcessWithoutNullStreams | null = null;

  function createStream() {
    const encoder = new TextEncoder();

    // ReadableStream
    // - サーバー側からデータを送りつけるための接続口
    //
    // SSE (Server-Sent Events)
    // - 1つのリクエストに対して、接続を維持したままサーバーから任意のタイミングで何度もデータを送れる
    // - 送りつけるデータのルール: 先頭に`data: `、末尾に`\n\n`
    return new ReadableStream({
      // start: ReadableStream インスタンスが作成されたときに一度だけ実行
      start(controller) {
        const pythonPath = path.join(process.cwd(), "python", "venv", "bin", "python");
        const scriptPath = path.join(process.cwd(), `python/${scriptName}`);

        // spawn: イベント駆動型の子プロセス起動
        // - 非同期でチャンクを1つずつ受け取るため、大量データの処理に適している
        childProcess = spawn(pythonPath, [scriptPath], {
          // Python 側で出力を溜め込まずリアルタイムに出力
          env: { ...process.env, PYTHONUNBUFFERED: "1" },
        });

        // Python の標準出力を受け取るたびに SSE 形式でフロントに送る
        childProcess.stdout.on("data", (data) => {
          const lines = data
            .toString()
            .split("\n")
            .filter((l: string) => l.trim());
          for (const line of lines) {
            controller.enqueue(encoder.encode(`data: ${line}\n\n`));
          }
        });
        // Python スクリプトが終了したらストリームを閉じる
        childProcess.stdout.on("end", () => {
          controller.close();
        });
        childProcess.stderr.on("data", (data) => {
          // Python の文法エラー
          console.log({ stderr: data.toString() });
        });
        childProcess.on("error", (error) => {
          console.log({ error: error.message });
        });
        childProcess.on("close", (code) => {
          console.log({ close: code });
          childProcess = null;
        });
      },
    });
  }

  // cancel: 実行中のプロセスに SIGINT を送る
  // - Python 側は signal.signal(signal.SIGINT, handleInterrupt) で受け取る
  // - 戻り値: プロセスが存在して停止を試みた場合 true
  function cancel(): boolean {
    if (childProcess) {
      childProcess.kill("SIGINT");
      return true;
    }
    return false;
  }

  return { createStream, cancel };
}

// sseResponse: SSE 用のレスポンスヘッダを付けて NextResponse を返す
// - ReadableStream により継続的なレスポンスを得ることができる
export function sseResponse(stream: ReadableStream) {
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
