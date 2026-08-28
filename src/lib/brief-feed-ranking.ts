import type { Region } from "@prisma/client";
import {
  regionEditorialRank,
  regionGroupForCode,
  regionGroupPriority,
} from "./supported-countries";

export type BriefRankArticle = {
  country: string;
  region: Region;
  publishedAt: Date;
  score?: { finalScore: number } | null;
};

/** Only true GLOBAL/EU desk stories — not every article stored with Prisma Region.GLOBAL. */
export function isGlobalBriefArticle(article: Pick<BriefRankArticle, "country">) {
  const code = article.country.trim().toUpperCase();
  return code === "GLOBAL" || code === "EU";
}

export function articleBriefPriority(article: Pick<BriefRankArticle, "country">) {
  if (isGlobalBriefArticle(article)) {
    return { tier: 0, memberRank: 0 };
  }
  const code = article.country.trim().toUpperCase();
  const group = regionGroupForCode(code);
  return {
    tier: regionGroupPriority(group),
    memberRank: regionEditorialRank(group, code),
  };
}

export function compareArticlesForBriefFeed(a: BriefRankArticle, b: BriefRankArticle) {
  const left = articleBriefPriority(a);
  const right = articleBriefPriority(b);
  if (left.tier !== right.tier) return left.tier - right.tier;
  if (left.memberRank !== right.memberRank) return left.memberRank - right.memberRank;
  const scoreDelta = (b.score?.finalScore ?? 0) - (a.score?.finalScore ?? 0);
  if (scoreDelta !== 0) return scoreDelta;
  return b.publishedAt.getTime() - a.publishedAt.getTime();
}

export function sortArticlesForBriefFeed<T extends BriefRankArticle>(articles: T[]) {
  return [...articles].sort(compareArticlesForBriefFeed);
}

export function shouldApplyBriefRanking(filters: {
  category?: string | null;
  country?: string | null;
  nationalityCodes?: string[];
  q?: string | null;
  region?: string | null;
  source?: string | null;
}) {
  return !filters.category
    && !filters.country
    && !(filters.nationalityCodes?.length)
    && !filters.q
    && !filters.region
    && !filters.source;
}
