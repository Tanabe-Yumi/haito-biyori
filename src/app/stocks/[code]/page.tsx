import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getStockWithScoresByCode,
  getFinancialHistoryByCode,
  getStockNameByCode,
} from "@/lib/api";
import { formatDate } from "@/lib/formatDate";
import { HistoricalChartTabs } from "@/components/HistoricalChartTabs";
import { CircleScoreGage } from "@/components/CircleScoreGage";
import { HoverInfoCard } from "@/components/HoverInfoCard";
import {
  ArrowLeft,
  BanknoteIcon,
  BarChart3Icon,
  Building2Icon,
  ChartColumnBigIcon,
  ChartLineIcon,
  ChartPieIcon,
  CoinsIcon,
  HandCoinsIcon,
  LandmarkIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";

interface StockDetailPageProps {
  params: Promise<{ code: string }>;
}

// ブラウザのタブ名を変更
export async function generateMetadata({ params }: StockDetailPageProps) {
  const { code } = await params;
  const stock = await getStockNameByCode(code);
  return {
    title: `${code} ${stock.name}`,
  };
}

const StockDetailPage = async ({ params }: StockDetailPageProps) => {
  const { code } = await params;
  const stock = await getStockWithScoresByCode(code).catch((e) =>
    console.error(e),
  );
  const history = await getFinancialHistoryByCode(code).catch((e) =>
    console.error(e),
  );

  if (!stock) {
    notFound();
  }

  const updatedDate = formatDate(new Date(stock.updatedAt));

  const evaluationItems = [
    {
      label: "売上",
      score: stock.salesScore,
      icon: TrendingUpIcon,
      longLabel: "売上 (Sales)",
      description: "会社の総売り上げ。右肩上がりが理想。",
    },
    {
      label: "営業利益率",
      score: stock.operatingProfitMarginScore,
      icon: ChartLineIcon,
      longLabel: "営業利益率 (Operating Profit Margin)",
      description: "効率的に稼げているかどうか。常に10%以上が理想。",
    },
    {
      label: "EPS",
      score: stock.epsScore,
      icon: ChartColumnBigIcon,
      longLabel: "EPS (Earnings Per Share)",
      description: "一株あたりの純利益。実質配当の上限。右肩上がりが理想。",
    },
    {
      label: "営業CF",
      score: stock.operatingCFScore,
      icon: CoinsIcon,
      longLabel: "営業CF (Operating Cash Flow)",
      description:
        "本業でどれだけ稼げているか。毎年黒字、できれば右肩上がりが理想。",
    },
    {
      label: "一株配当",
      score: stock.dividendPerShareScore,
      icon: HandCoinsIcon,
      longLabel: "一株配当 (Dividend per Share)",
      description: "1株あたりの配当金。減配がないことが理想。",
    },
    {
      label: "配当性向",
      score: stock.payoutRatioScore,
      icon: ChartPieIcon,
      longLabel: "配当性向 (Dividend Ratio)",
      description:
        "純利益のうちどれだけを配当に回しているか。高すぎても危険。30~50%が理想。",
    },
    {
      label: "自己資本比率",
      score: stock.equityRatioScore,
      icon: ShieldCheckIcon,
      longLabel: "自己資本比率 (Equity Ratio)",
      description:
        "総資産のうち、返済の必要がないお金の比率。より高い比率が理想。40%以上など。",
    },
    {
      label: "現金等",
      score: stock.cashScore,
      icon: BanknoteIcon,
      longLabel: "現金等 (Cash and Cash Equivalents)",
      description:
        "企業体力。多いほど、不況に強い。長期的に増加していることが理想。",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 pt-0 md:p-8 md:pt-0 space-y-6">
      {/* TODO: ページやフィルターも前のを引き継いだ状態で戻る */}
      <Link
        href="/"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        一覧に戻る
      </Link>

      {/* 基本情報 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 p-6 md:p-8 bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="flex flex-col gap-y-2">
          <div className="flex flex-wrap items-center gap-1">
            <Badge className="font-bold">{stock.code}</Badge>
            <Badge className="font-medium bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <LandmarkIcon data-icon="inline-start" />
              {stock.market}
            </Badge>
            <Badge className="font-medium bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              <Building2Icon data-icon="inline-start" />
              {stock.industry}
            </Badge>
          </div>
          <div className="flex gap-3">
            <h2 className="text-3xl font-bold">{stock.name}</h2>
            {/* TODO: 企業公式サイトへのリンク */}
          </div>
          {/* TODO: お気に入り登録ボタン */}
        </div>

        <div className="flex items-center gap-6">
          <div className="text-left">
            <p className="text-sm text-muted-foreground font-medium">現在値</p>
            <p className="text-2xl font-bold text-right text-gray-900">
              ¥{stock.price ?? " -"}
            </p>
          </div>
          <Separator orientation="vertical" />
          <div className="text-left">
            <p className="text-sm text-muted-foreground font-medium">
              配当利回り
            </p>
            <p className="text-2xl font-bold text-right text-emerald-700">
              {stock.dividendYield ?? "- "}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左側: 総合スコア */}
        <div className="md:col-span-1 bg-linear-to-br from-emerald-600 to-teal-500 rounded-2xl shadow-lg p-8 text-white flex flex-col items-center justify-center relative overflow-hidden group">
          {/* 背景装飾のサークル */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white opacity-20 rounded-full group-hover:scale-110 transition-transform duration-500"></div>

          <h3 className="text-lg font-bold mb-4 text-white uppercase tracking-widest">
            総合スコア
          </h3>
          <CircleScoreGage score={stock.totalScore} maxScore={40} />
        </div>

        {/* 右側: 項目ごとのスコア */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 md:p-8">
          <h3 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <BarChart3Icon className="text-emerald-600 w-5 h-5" />
            評価項目
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {evaluationItems.map((item, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium flex items-center gap-2">
                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded">
                      {item.icon ? (
                        <item.icon className="size-4" />
                      ) : (
                        <TrendingUpIcon className="size-4" />
                      )}
                    </span>
                    {item.label}
                    {/* 項目の詳細（ホバー表示） */}
                    <HoverInfoCard
                      title={item.longLabel}
                      description={item.description}
                    />
                  </span>
                  <span className="font-bold text-neutral-800">
                    {item.score ?? "-"} / 5
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{
                      width: `${item.score ? (item.score / 5) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 業績グラフ */}
      <div className="p-6 md:p-8 bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <HistoricalChartTabs history={history ?? []} />
      </div>

      {/* 最終更新日 */}
      <div className="flex flex-col gap-y-2 text-right text-sm text-muted-foreground">
        最終更新：{updatedDate}
      </div>
    </div>
  );
};

export default StockDetailPage;
