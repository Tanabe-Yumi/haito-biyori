"use client";

// TODO: サーバーコンポーネントにできるか？？

import React from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { FinancialStatement } from "@/types/stock";

const items = [
  { value: "sales", unit: "百万円", type: "bar" },
  { value: "operatingProfitMargin", unit: "%", type: "line" },
  { value: "eps", unit: "円", type: "line" },
  { value: "operatingCF", unit: "百万円", type: "bar" },
  { value: "dividendPerShare", unit: "円", type: "bar" },
  { value: "payoutRatio", unit: "%", type: "line" },
  { value: "equityRatio", unit: "%", type: "line" },
  { value: "cash", unit: "百万円", type: "bar" },
] as const;

const chartConfig = {
  sales: { label: "売上", color: "var(--chart-2)" },
  operatingProfitMargin: { label: "営業利益率", color: "var(--chart-4)" },
  eps: { label: "EPS", color: "var(--chart-5)" },
  operatingCF: { label: "営業CF", color: "var(--chart-3)" },
  dividendPerShare: { label: "一株配当", color: "var(--chart-2)" },
  payoutRatio: { label: "配当性向", color: "var(--chart-4)" },
  equityRatio: { label: "自己資本比率", color: "var(--chart-4)" },
  cash: { label: "現金等", color: "var(--chart-2)" },
} satisfies ChartConfig;

type HistoricalChartProps = {
  history: FinancialStatement[];
};

// チャートのベースコンポーネント
const BaseHistoricalChart = ({
  history,
  leftUnit = "百万円",
  children,
}: HistoricalChartProps & { leftUnit?: string; children: React.ReactNode }) => {
  // TODO: 各年度で最新のデータだけ表示する
  return (
    <ChartContainer config={chartConfig} className="min-h-50 w-full">
      <ComposedChart data={history} margin={{ top: 30 }}>
        {/* グリッド線 */}
        <CartesianGrid vertical={false} />
        {/* x軸 */}
        <XAxis
          dataKey="year"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        {/* y軸 */}
        <YAxis
          yAxisId="yen"
          orientation="left"
          strokeWidth={1}
          tickLine={false}
          label={{ value: leftUnit, angle: -90, position: "insideLeft" }}
        />
        <YAxis
          yAxisId="percent"
          orientation="right"
          strokeWidth={1}
          tickLine={false}
          label={{ value: "%", angle: 90, position: "insideRight" }}
        />
        {/* Tooltip */}
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, name) =>
                `${name[0].payload.year}年 ${name[0].payload.month}月`
              }
              formatter={(value, name) => (
                <>
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: `var(--color-${name})` }}
                  />
                  {chartConfig[name as keyof typeof chartConfig]?.label || name}
                  <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                    {value}
                    <span className="text-muted-foreground font-normal">
                      {items.find((i) => i.value === name)?.unit}
                    </span>
                  </div>
                </>
              )}
            />
          }
        />
        {/* 凡例 */}
        <ChartLegend content={<ChartLegendContent />} />

        {/* 棒グラフ / 折れ線グラフ */}
        {children}
      </ComposedChart>
    </ChartContainer>
  );
};

// 業績チャート
export const HistoricalChartGyoseki = ({ history }: HistoricalChartProps) => (
  <BaseHistoricalChart history={history} leftUnit="百万円">
    <Bar dataKey="sales" yAxisId="yen" fill="var(--color-sales)" radius={4} />
    <Bar
      dataKey="operatingCF"
      yAxisId="yen"
      fill="var(--color-operatingCF)"
      radius={4}
    />
    <Line
      dataKey="operatingProfitMargin"
      yAxisId="percent"
      type="linear"
      stroke="var(--color-operatingProfitMargin)"
      strokeWidth={3}
    />
    <Line
      dataKey="eps"
      yAxisId="percent"
      type="linear"
      stroke="var(--color-eps)"
      strokeWidth={3}
    />
  </BaseHistoricalChart>
);

// 配当チャート
export const HistoricalChartHaito = ({ history }: HistoricalChartProps) => (
  <BaseHistoricalChart history={history} leftUnit="円">
    <Bar
      dataKey="dividendPerShare"
      yAxisId="yen"
      fill="var(--color-dividendPerShare)"
      radius={4}
    />
    <Line
      dataKey="payoutRatio"
      yAxisId="percent"
      type="linear"
      stroke="var(--color-payoutRatio)"
      strokeWidth={3}
    />
  </BaseHistoricalChart>
);

// 財務チャート
export const HistoricalChartZaimu = ({ history }: HistoricalChartProps) => (
  <BaseHistoricalChart history={history} leftUnit="百万円">
    <Bar dataKey="cash" yAxisId="yen" fill="var(--color-cash)" radius={4} />
    <Line
      dataKey="equityRatio"
      yAxisId="percent"
      type="linear"
      stroke="var(--color-equityRatio)"
      strokeWidth={3}
    />
  </BaseHistoricalChart>
);
