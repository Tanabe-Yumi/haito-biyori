import { NextResponse } from "next/server";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import path from "path";

// child_process: ワーカープロセスとは完全に分離された別のプロセスを実行する

// exec: コマンド実行
// - コールバック関数を指定
// - 大量データを処理する場合、処理中は呼び出し元プロセスがフリーズしてしまう

// spawn: event を listen する
// - イベント駆動型
// - 非同期
// - チャンクを1つずつ取得して処理する
// - 大量データの処理を行う場合に適している

// python 実行のプロセス
// - フロントのキャンセルボタンから停止するため関数外で定義
let fetchProcess: ChildProcessWithoutNullStreams | null = null;

export async function GET() {
  const encoder = new TextEncoder();

  // ReadableStream
  // - サーバー側からデータを送りつけるための接続口

  // SSE (Server-Sent Events)
  // - 1つのリクエストに対して、接続を維持したままサーバーから任意のタイミングで何度もデータを送れる
  // - 送りつけるデータのルール: 先頭に`data: `、末尾に`\n\n`
  //   - data: xxx\n\n
  const stream = new ReadableStream({
    // start
    // - ReadableStream インスタンスが作成されたときに一度だけ実行
    start(controller) {
      // venv 指定
      const pythonPath = path.join(process.cwd(), "python/venv/bin/python");
      // Python スクリプトの絶対パス
      const scriptPath = path.join(process.cwd(), "python/fetchStockPrices.py");
      // const scriptPath = path.join(process.cwd(), "python/test.py");
      // spawn プロセスを生成
      fetchProcess = spawn(pythonPath, [scriptPath], {
        // Python 側で出力を溜め込まずリアルタイムに出力
        env: { ...process.env, PYTHONUNBUFFERED: "1" },
      });

      // spawn のイベントハンドラーを設定
      // - データが届くたびに controller.enqueue() でフロントに送る
      // on("data", () => {...})
      // - "data" イベントにより発火
      //   - stream から新しいデータが流れてくるイベント
      fetchProcess.stdout.on("data", (data) => {
        const lines = data
          .toString()
          .split("\n")
          .filter((l: string) => l.trim());
        for (const line of lines) {
          controller.enqueue(encoder.encode(`data: ${line}\n\n`));
        }
      });
      fetchProcess.stdout.on("end", () => {
        controller.close();
      });
      fetchProcess.stderr.on("data", (data) => {
        // Python の文法エラー
        console.log({ stderr: data.toString() });
      });
      fetchProcess.on("error", (error) => {
        console.log({ error: error.message });
      });
      fetchProcess.on("close", (code) => {
        console.log({ close: code });
        fetchProcess = null;
      });
    },
  });

  return new NextResponse(stream, {
    // text/event-stream
    // - SSE (Server-Sent Events) 用
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// キャンセル用の関数（POSTメソッドなど）
export async function POST(req: Request) {
  if (fetchProcess) {
    fetchProcess.kill("SIGINT");
    return NextResponse.json({ message: "停止中..." });
  }
  return NextResponse.json({ message: "実行中の処理がありません" });
}
