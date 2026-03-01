"use client";

// TODO: サーバーコンポーネントにできるか？？

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FinancialStatement } from "@/types/stock";

type HistoricalChartProps = {
  history: FinancialStatement[];
};

export const HistoricalChart = ({ history }: HistoricalChartProps) => {
  // TODO: 各年度で最新のデータだけ表示する

  return (
    <div className="w-full h-100">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={history}
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <CartesianGrid stroke="#f5f5f5" />
          <XAxis dataKey="year" scale="band" />
          {/* YAxis for Sales (Bar) */}
          <YAxis
            yAxisId="left"
            orientation="left"
            stroke="#8884d8"
            label={{
              value: "売上 (百万円)",
              angle: -90,
              position: "insideLeft",
            }}
          />
          {/* YAxis for EPS/Dividend (Line) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#82ca9d"
            label={{ value: "円", angle: 90, position: "insideRight" }}
          />
          <YAxis
            yAxisId="right2"
            orientation="right"
            stroke="#ff7300"
            label={{ value: "%", angle: 90, position: "insideRight" }}
          />

          <Tooltip
            formatter={(value) =>
              value !== undefined ? Number(value).toLocaleString() : ""
            }
            labelStyle={{ color: "black" }}
          />
          <Legend />

          <Bar
            yAxisId="left"
            dataKey="sales"
            name="売上高"
            barSize={20}
            fill="#413ea0"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="dividendPerShare"
            name="配当金"
            stroke="#82ca9d"
            strokeWidth={2}
          />
          <Line
            yAxisId="right2"
            type="monotone"
            dataKey="operatingProfitMargin"
            name="営業利益率"
            stroke="#ff7300"
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
