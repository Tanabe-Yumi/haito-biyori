import type { Metadata } from "next";
import { HomePage } from "@/components/HomePage";
import {
  loadStockListParams,
  serializeStockListParams,
} from "@/lib/stockListParams";

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// canonical URL を設定
// クエリの順序違いや未知のパラメータによって、同じ検索条件のページが
// 重複コンテンツと判定されないよう、正規の順序に並べ直した URL を示す
export async function generateMetadata({
  searchParams,
}: HomeProps): Promise<Metadata> {
  const params = await loadStockListParams(searchParams);
  return {
    alternates: {
      canonical: serializeStockListParams("/", params),
    },
  };
}

const Home = () => {
  return <HomePage />;
};

export default Home;
