import { kuwaitDate } from "./market";
import { limits } from "./limits";
import { prisma } from "./prisma";

const STATS_TTL_MS = 30_000;

type NewsFeedStats = {
  storedCount: number;
  articleCount: number;
  editionItemCount: number;
  liveCountries: string[];
  sourceCountries: string[];
  healthySources: number;
  sourceCount: number;
  lastSourceFetchAt: Date | null;
};

let statsCache: { at: number; data: NewsFeedStats } | null = null;

export async function getNewsFeedStats(): Promise<NewsFeedStats> {
  const now = Date.now();
  if (statsCache && now - statsCache.at < STATS_TTL_MS) return statsCache.data;

  try {
    const liveCutoff = new Date(now - Math.max(1, limits.newsMaxAgeHours) * 60 * 60 * 1000);
    const healthCutoff = new Date(now - Math.max(1, limits.sourceHealthMaxAgeHours) * 60 * 60 * 1000);

    const [storedCount, articleCount, sources, edition, liveCountries] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { publishedAt: { gte: liveCutoff } } }),
      prisma.source.findMany({
        where: { enabled: true },
        select: { country: true, lastFetchedAt: true, lastError: true },
      }),
      prisma.dailyEdition.findUnique({
        where: { date: kuwaitDate() },
        select: { itemCount: true },
      }),
      prisma.article.groupBy({
        by: ["country"],
        where: { publishedAt: { gte: liveCutoff } },
      }),
    ]);

    const data: NewsFeedStats = {
      storedCount,
      articleCount,
      editionItemCount: edition?.itemCount ?? 0,
      liveCountries: liveCountries.map((row) => row.country),
      sourceCountries: sources.map((source) => source.country),
      healthySources: sources.filter((source) => (
        source.lastFetchedAt
        && source.lastFetchedAt >= healthCutoff
        && !source.lastError
      )).length,
      sourceCount: sources.length,
      lastSourceFetchAt: sources.reduce<Date | null>((latest, source) => {
        if (!source.lastFetchedAt) return latest;
        if (!latest || source.lastFetchedAt > latest) return source.lastFetchedAt;
        return latest;
      }, null),
    };
    statsCache = { at: now, data };
    return data;
  } catch {
    console.error("news feed stats unavailable");
    return {
      storedCount: 0,
      articleCount: 0,
      editionItemCount: 0,
      liveCountries: [],
      sourceCountries: [],
      healthySources: 0,
      sourceCount: 0,
      lastSourceFetchAt: null,
    };
  }
}
