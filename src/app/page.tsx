import { getStocksWithTotalScore } from "@/lib/api";
import { StockDashboard } from "@/components/StockDashboard";
import { DataNotFoundArea } from "@/components/layout/DataNotFoundArea";

interface SearchParams {
  min_yield?: string;
  page?: string;
}

const Home = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const params = await searchParams;
  const minYieldParam = params.min_yield;
  const minYield =
    minYieldParam === undefined ? 3.5 : parseFloat(minYieldParam);

  // ページネーションパラメータ
  const pageSize = 20;
  const currentPage = parseInt(params.page || "0");

  const { stocks, totalCount } = await getStocksWithTotalScore(
    minYield,
    currentPage,
    pageSize,
  ).catch((e) => {
    console.error(e);
    return { stocks: [], totalCount: 0 };
  });

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl inline-block bg-linear-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
          高配当株スコアリング
        </h1>
        <p className="text-foreground max-w-2xl text-lg">
          配当利回り3.5%以上の優良銘柄を8つの指標で厳選分析。スコアが高いほど健全な財務と高い還元期待を持てます。
        </p>
      </section>

      {stocks.length === 0 ? (
        // TODO: 表の中に「データがありません」表示をする
        <DataNotFoundArea />
      ) : (
        <StockDashboard
          stocks={stocks}
          total={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
        />
      )}
    </div>
  );
};

export default Home;
