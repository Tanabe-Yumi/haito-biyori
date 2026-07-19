"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  notifyPortfolioChanged,
  usePortfolioSyncEffect,
} from "@/hooks/use-portfolio-sync";

// ポートフォリオへの登録状態を一覧ページで共有するコンテキスト
// (行ごとの追加ボタンが個別にfetchしなくて済むよう、登録済みコードを一括保持する)
interface PortfolioContextValue {
  // 登録済みの銘柄コード
  codes: Set<string>;
  // 追加/削除をトグルする
  toggle: (code: string) => Promise<void>;
  // 未登録の銘柄をまとめて追加し、追加した件数を返す
  addAll: (codes: string[]) => Promise<number>;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function usePortfolio() {
  return useContext(PortfolioContext);
}

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [codes, setCodes] = useState<Set<string>>(new Set());

  // 登録済みコードを取得
  const refresh = useCallback(() => {
    fetch("/api/portfolio")
      .then((res) => res.json())
      .then((stocks: { code: string }[]) =>
        setCodes(new Set(stocks.map((s) => s.code))),
      )
      .catch((e) => console.error("Error fetching portfolio:", e));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 他のタブでの変更に追従する
  usePortfolioSyncEffect(refresh);

  const toggle = useCallback(
    async (code: string) => {
      const isAdded = codes.has(code);

      // 楽観的更新
      setCodes((prev) => {
        const next = new Set(prev);
        if (isAdded) {
          next.delete(code);
        } else {
          next.add(code);
        }
        return next;
      });

      try {
        if (isAdded) {
          await fetch(`/api/portfolio/${code}`, { method: "DELETE" });
        } else {
          await fetch("/api/portfolio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });
        }
        notifyPortfolioChanged();
      } catch (e) {
        console.error("Error toggling portfolio:", e);
        // 失敗したら元に戻す
        setCodes((prev) => {
          const next = new Set(prev);
          if (isAdded) {
            next.add(code);
          } else {
            next.delete(code);
          }
          return next;
        });
      }
    },
    [codes],
  );

  const addAll = useCallback(
    async (newCodes: string[]) => {
      const toAdd = newCodes.filter((code) => !codes.has(code));
      if (toAdd.length === 0) {
        return 0;
      }

      // 楽観的更新
      setCodes((prev) => new Set([...prev, ...toAdd]));

      try {
        await fetch("/api/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codes: toAdd }),
        });
        notifyPortfolioChanged();
      } catch (e) {
        console.error("Error adding portfolio stocks:", e);
        // 失敗したら元に戻す
        setCodes((prev) => {
          const next = new Set(prev);
          toAdd.forEach((code) => next.delete(code));
          return next;
        });
        return 0;
      }

      return toAdd.length;
    },
    [codes],
  );

  return (
    <PortfolioContext.Provider value={{ codes, toggle, addAll }}>
      {children}
    </PortfolioContext.Provider>
  );
}
