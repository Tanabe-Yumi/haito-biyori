import type { Metadata } from "next";
import { PortfolioPage } from "@/components/PortfolioPage";

export const metadata: Metadata = {
  title: "ポートフォリオ",
  alternates: {
    canonical: "/portfolio",
  },
};

const Portfolio = () => {
  return <PortfolioPage />;
};

export default Portfolio;
