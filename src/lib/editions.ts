import { prisma } from "./prisma";
import { parseQuery, serializeArticle } from "./api";
import { kuwaitDate } from "./market";
import { limits } from "./limits";
import { ensureTodaysEdition } from "./pipeline";

function parseEditionPagination(searchParams?: URLSearchParams) {
  const params = searchParams ?? new URLSearchParams();
  const requested = params.get("limit");
  const defaultLimit = limits.dailyEdition;
  const limit = requested
    ? Math.min(limits.apiMax, Math.max(1, Number(requested) || defaultLimit))
    : defaultLimit;
  const offset = Math.max(0, Number(params.get("offset") || 0));
  if (!Number.isFinite(limit) || !Number.isFinite(offset)) {
    throw new Error("Invalid pagination");
  }
  return { limit, offset };
}

export async function getDailyEditionPayload(date: string, searchParams?: URLSearchParams) {
  const query = parseQuery(
    searchParams ?? new URLSearchParams(),
    { applyDefaultFreshness: false },
  );
  const pagination = parseEditionPagination(searchParams);
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

  const filteredCount = edition.items.length;
  const pageItems = edition.items.slice(
    pagination.offset,
    pagination.offset + pagination.limit,
  );

  return {
    date: edition.date,
    feature: "market_news",
    status: edition.status.toLowerCase(),
    locked: edition.locked,
    itemCount: edition.itemCount,
    summary: edition.summary,
    updatedAt: edition.updatedAt.toISOString(),
    count: pageItems.length,
    total: filteredCount,
    limit: pagination.limit,
    offset: pagination.offset,
    filters: query.filters,
    meta: {
      lang: query.filters.lang,
      timezone: process.env.APP_TIMEZONE || "Asia/Kuwait",
      editionSize: limits.dailyEdition,
    },
    items: pageItems.map((item) => ({
      ...serializeArticle(item.article, item.rank, query.filters.lang),
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
