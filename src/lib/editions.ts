import { prisma } from "./prisma";
import { articleListOrderBy, listDedupedArticles, parseQuery, serializeArticle } from "./api";
import { hasLocalizedDisplay } from "./article-translation";
import { isBlockedArticle } from "./content-safety";
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

  const safeItems = edition.items.filter((item) => !isBlockedArticle(item.article));
  const filteredCount = safeItems.length;
  const pageItems = safeItems.slice(
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

function hasEditionFeedFilters(searchParams: URLSearchParams) {
  return Boolean(
    searchParams.get("q")?.trim()
    || searchParams.get("category")
    || searchParams.get("country")
    || searchParams.get("nationality")
    || searchParams.get("from")
    || searchParams.get("to")
    || searchParams.get("sort") === "date",
  );
}

async function listImpactRankedFallbackArticles(
  searchParams: URLSearchParams,
  options: { lang: "ar" | "en"; searchVariants?: string[] },
) {
  const lang = options.lang === "en" ? "en" : "ar";
  const liveQuery = parseQuery(searchParams, {
    applyDefaultFreshness: true,
    searchVariants: options.searchVariants,
  });
  const { items } = await listDedupedArticles(
    liveQuery.where,
    articleListOrderBy("score"),
    limits.dailyEdition,
    0,
    { lang, applyBriefRanking: true },
  );
  return items;
}

export async function listTodaysEditionFeedArticles(
  searchParams: URLSearchParams,
  options: { lang: "ar" | "en"; searchVariants?: string[] } = { lang: "ar" },
) {
  await ensureTodaysEdition();
  // Edition rows are pre-curated; do not re-apply the live freshness window here
  // (getDailyEditionPayload uses the same rule). Freshness on edition items caused
  // itemCount/pulse to show N while the homepage feed returned zero.
  const query = parseQuery(searchParams, {
    applyDefaultFreshness: false,
    searchVariants: options.searchVariants,
  });
  const edition = await prisma.dailyEdition.findUnique({
    where: { date: kuwaitDate() },
    select: {
      itemCount: true,
      items: {
        where: { article: query.where },
        include: { article: { include: { source: true, score: true } } },
        orderBy: { rank: "asc" },
      },
    },
  });

  const lang = options.lang === "en" ? "en" : "ar";
  let items = (edition?.items ?? [])
    .map((item) => item.article)
    .filter((article) => !isBlockedArticle(article))
    .filter((article) => hasLocalizedDisplay(article, lang));

  const editionSize = Math.max(1, limits.dailyEdition);
  const unfilteredTopEdition = !hasEditionFeedFilters(searchParams);

  if (items.length === 0) {
    items = await listImpactRankedFallbackArticles(searchParams, options);
  } else if (unfilteredTopEdition && items.length < editionSize) {
    const fallback = await listImpactRankedFallbackArticles(searchParams, options);
    const seen = new Set(items.map((article) => article.id));
    for (const article of fallback) {
      if (items.length >= editionSize) break;
      if (seen.has(article.id)) continue;
      items.push(article);
      seen.add(article.id);
    }
  }

  const visibleItems = unfilteredTopEdition ? items.slice(0, editionSize) : items;

  return {
    count: visibleItems.length,
    items: visibleItems,
    editionItemCount: edition?.itemCount ?? visibleItems.length,
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
