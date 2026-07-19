"use client";

import { useEffect, useRef } from "react";

// タブ間でポートフォリオの変更を通知するチャンネル名
const CHANNEL_NAME = "portfolio-sync";

// ポートフォリオを変更したことを他のタブへ通知する
// (追加・削除・株数変更などの後に呼ぶ。送信者自身には届かない)
export function notifyPortfolioChanged() {
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage("changed");
  channel.close();
}

// ポートフォリオの変更に追従するためのフック
// - 他のタブからの変更通知 (BroadcastChannel) を受けたとき
// - タブが再び表示されたとき (通知を取りこぼした場合の保険)
// に onChange を呼ぶ
export function usePortfolioSyncEffect(onChange: () => void) {
  // 再購読なしで最新のコールバックを呼べるよう ref に保持する
  // (ref への書き込みはレンダリング中に行えないため effect の中で行う)
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = () => onChangeRef.current();

    const handleVisible = () => {
      if (document.visibilityState === "visible") {
        onChangeRef.current();
      }
    };
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      channel.close();
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, []);
}
