import {
  BanknoteIcon,
  ChartLineIcon,
  ChartNoAxesCombinedIcon,
  HandCoinsIcon,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HistoricalChartGyoseki,
  HistoricalChartHaito,
  HistoricalChartZaimu,
} from "@/components/HistoricalChart";
import { FinancialStatement } from "@/types/stock";

type HistoricalChartTabsProps = {
  history: FinancialStatement[];
};

export const HistoricalChartTabs = ({ history }: HistoricalChartTabsProps) => {
  const tabs = [
    { label: "業績", value: "gyoseki", icon: ChartLineIcon },
    { label: "配当", value: "haito", icon: HandCoinsIcon },
    { label: "財務", value: "zaimu", icon: BanknoteIcon },
  ];

  return (
    <Tabs defaultValue="gyoseki">
      {/* 収まらない幅ではタブがタイトルの下に折り返す */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 whitespace-nowrap">
          <ChartNoAxesCombinedIcon className="text-emerald-600 w-5 h-5" />
          業績グラフ
        </h3>
        {/* sm 未満では全幅の3等分 (セグメンテッドコントロール) にする
            max-sm:h-auto!: TabsList の固定高 (h-9) をトリガーの高さに追従させ、
            背景がタブより短くなるのを防ぐ (詳細度の高いセレクタで指定されているため ! で上書き) */}
        <TabsList className="ml-auto max-sm:h-auto! max-sm:w-full max-sm:grid max-sm:grid-cols-3">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="p-2 max-sm:py-1 data-[state=active]:font-bold data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-500"
            >
              <tab.icon />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {!history?.length ? (
        <p className="mt-4 text-left text-sm text-muted-foreground">
          データがありません
        </p>
      ) : (
        tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.value === "gyoseki" && (
              <HistoricalChartGyoseki history={history} />
            )}
            {tab.value === "haito" && (
              <HistoricalChartHaito history={history} />
            )}
            {tab.value === "zaimu" && (
              <HistoricalChartZaimu history={history} />
            )}
          </TabsContent>
        ))
      )}
    </Tabs>
  );
};
