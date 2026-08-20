import { prisma } from "./prisma";
import { parseQuery, serializeArticle } from "./api";
import { localizeFetchedArticles } from "./article-translation";
import { kuwaitDate } from "./market";
import { limits } from "./limits";
import { ensureTodaysEdition } from "./pipeline";

export async function getDailyEditionPayload(date: string, searchParams?: URLSearchParams) {
  const query = parseQuery(
    searchParams ?? new URLSearchParams(),
    { applyDefaultFreshness: false },
  );
  if (date === kuwaitDate()) {
    await ensureTodaysEdition();
  }
  const edition = await prisma.dailyEdition.findUnique({
    where: { date },
    include: {
      items: {
        where: { article: query.where },
        include: { article: { include: { source: true, score: true } } },
        orderBy: { rank: "asc" },
      },
    },
  });

  if (!edition) return null;

  const localizedArticles = await localizeFetchedArticles(
    edition.items.map((item) => item.article),
    query.filters.lang,
  );
  const byId = new Map(localizedArticles.map((article) => [article.id, article]));

  return {
    date: edition.date,
    feature: "market_news",
    status: edition.status.toLowerCase(),
    locked: edition.locked,
    itemCount: edition.itemCount,
    summary: edition.summary,
    updatedAt: edition.updatedAt.toISOString(),
    count: edition.items.length,
    filters: query.filters,
    meta: {
      lang: query.filters.lang,
      timezone: process.env.APP_TIMEZONE || "Asia/Kuwait",
    },
    items: edition.items.map((item) => ({
      ...serializeArticle(byId.get(item.article.id) ?? item.article, item.rank, query.filters.lang),
      section: item.section,
    })),
  };
}

export async function listDailyEditions(limit = limits.editionsList) {
  const editions = await prisma.dailyEdition.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { date: "desc" },
    take: Math.min(Math.max(limits.editionsList, 1), Math.max(1, limit)),
    select: {
      date: true,
      status: true,
      locked: true,
      itemCount: true,
      summary: true,
      updatedAt: true,
    },
  });

  return {
    today: kuwaitDate(),
    count: editions.length,
    items: editions.map((edition) => ({
      date: edition.date,
      status: edition.status.toLowerCase(),
      locked: edition.locked,
      itemCount: edition.itemCount,
      summary: edition.summary,
      updatedAt: edition.updatedAt.toISOString(),
      url: `/api/v1/market-news/daily?date=${edition.date}`,
    })),
  };
}
