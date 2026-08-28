export type ImpactTier = "high" | "moderate" | "watch" | "low";

export type MarketImpactKey = "oil" | "rates" | "markets";

export type ArticleImpactScore = {
  finalScore: number;
  oilImpact: number;
  ratesImpact: number;
  marketImpact: number;
};

export function impactTierFromScore(score: number): ImpactTier {
  if (score >= 75) return "high";
  if (score >= 50) return "moderate";
  if (score >= 25) return "watch";
  return "low";
}

export function marketImpactRows(score: Pick<ArticleImpactScore, "oilImpact" | "ratesImpact" | "marketImpact">) {
  return [
    { key: "oil" as const, value: score.oilImpact },
    { key: "rates" as const, value: score.ratesImpact },
    { key: "markets" as const, value: score.marketImpact },
  ];
}

export function impactTierFromArticle(score: ArticleImpactScore | null | undefined) {
  if (!score) return "low" as const;
  const rows = marketImpactRows(score);
  const headline = Math.max(score.finalScore, ...rows.map((row) => row.value));
  return impactTierFromScore(headline);
}
