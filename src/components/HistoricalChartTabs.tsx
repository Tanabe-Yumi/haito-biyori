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
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
          <ChartNoAxesCombinedIcon className="text-emerald-600 w-5 h-5" />
          業績グラフ
        </h3>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="p-2 data-[state=active]:font-bold data-[state=active]:text-emerald-600"
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
