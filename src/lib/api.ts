import { Category, Prisma } from "@prisma/client";
import { categoryFromCode, categoryToCode, regionFromCode, regionToCode } from "./market";
import { articleLocalizedText, isArabicText, isBilingualComplete, isEnglishText, localizeFetchedArticles } from "./article-translation";
import { optimizedFetchUrl } from "./cloudinary";
import { storyGroupKey } from "./dedupe";
import { limits } from "./limits";
import { prisma } from "./prisma";
import {
  audienceCodesFromValue,
  expandNationalityInputs,
  optionForCode,
} from "./nationalities";
import { searchWords, countryCodesForSearchWord } from "./search";

const DEDUPE_SCAN_BATCH = 80;
const DEDUPE_MAX_SCAN = 2000;

const articleListInclude = { source: true, score: true } as const;
type ListedArticle = Prisma.ArticleGetPayload<{ include: typeof articleListInclude }>;

export function articleListOrderBy(sort: "date" | "score") {
  return sort === "date"
    ? [{ publishedAt: "desc" as const }]
    : [{ score: { finalScore: "desc" as const } }, { publishedAt: "desc" as const }];
}

export async function countDedupedArticles(
  where: Prisma.ArticleWhereInput,
  orderBy: Prisma.ArticleOrderByWithRelationInput[],
) {
  const seen = new Set<string>();
  let count = 0;
  let dbSkip = 0;

  while (dbSkip < DEDUPE_MAX_SCAN) {
    const batch = await prisma.article.findMany({
      where,
      include: articleListInclude,
      orderBy,
      take: DEDUPE_SCAN_BATCH,
      skip: dbSkip,
    });
    if (!batch.length) break;
    dbSkip += batch.length;
    for (const article of batch) {
      const group = storyGroupKey(article);
      if (seen.has(group)) continue;
      seen.add(group);
      count += 1;
    }
  }

  return count;
}

export async function fetchDedupedArticles(
  where: Prisma.ArticleWhereInput,
  orderBy: Prisma.ArticleOrderByWithRelationInput[],
  limit: number,
  offset: number,
): Promise<ListedArticle[]> {
  const seen = new Set<string>();
  const page: ListedArticle[] = [];
  let dbSkip = 0;
  let uniqueSkipped = 0;

  while (page.length < limit && dbSkip < DEDUPE_MAX_SCAN) {
    const batch = await prisma.article.findMany({
      where,
      include: articleListInclude,
      orderBy,
      take: DEDUPE_SCAN_BATCH,
      skip: dbSkip,
    });
    if (!batch.length) break;
    dbSkip += batch.length;

    for (const article of batch) {
      const group = storyGroupKey(article);
      if (seen.has(group)) continue;
      seen.add(group);
      if (uniqueSkipped < offset) {
        uniqueSkipped += 1;
        continue;
      }
      page.push(article);
      if (page.length >= limit) break;
    }
  }

  return page;
}

export function describeQueryFailure(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  const unknownField = raw.match(/Unknown argument `([^`]+)`/)?.[1];
  if (unknownField || raw.includes("Invalid `prisma")) {
    return {
      status: 500,
      error: "server_error",
      message: unknownField
        ? `Database client is out of date (unknown field ${unknownField}). Restart the app server after applying schema changes.`
        : "The database query failed. Restart the app server if you recently changed the schema.",
    };
  }
  return {
    status: 400,
    error: "invalid_query",
    message: raw,
  };
}

export function extractApiError(payload: unknown, fallback = "The API request failed.") {
  if (!payload || typeof payload !== "object") return fallback;
  const body = payload as Record<string, unknown>;
  const nested = body.response && typeof body.response === "object"
    ? body.response as Record<string, unknown>
    : null;
  const candidate = [body.message, nested?.message, body.error, nested?.error]
    .find((value) => typeof value === "string" && value.trim());
  return typeof candidate === "string" ? candidate.trim() : fallback;
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function parseQuery(
  params: URLSearchParams,
  options: { applyDefaultFreshness?: boolean; searchVariants?: string[] } = {},
) {
  const applyDefaultFreshness = options.applyDefaultFreshness !== false;
  const requested = Number(params.get("limit") || limits.apiDefault);
  const limit = Math.min(limits.apiMax, Math.max(1, Number.isFinite(requested) ? requested : limits.apiDefault));
  const offset = Math.max(0, Number(params.get("offset") || 0));
  const categories = (params.get("category") || "")
    .split(",").filter(Boolean).map(categoryFromCode).filter((value) => value !== undefined);
  const countries = (params.get("country") || "")
    .split(",").filter(Boolean).map((value) => value.toUpperCase());
  const sources = (params.get("source") || "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  const language = params.get("language")?.trim().toLowerCase() || "";
  const langParam = params.get("lang")?.trim().toLowerCase() || "";
  const lang = langParam === "en" || langParam === "ar" ? langParam : "ar";
  const searchText = params.get("q")?.trim().slice(0, 200) || "";
  const searchIn = ["title", "summary", "both"].includes(params.get("searchIn") || "")
    ? params.get("searchIn")!
    : "both";
  const nationalityInput = params.getAll("nationality")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  const nationalityCodes = expandNationalityInputs(nationalityInput);
  if (nationalityInput.length && !nationalityCodes.length) {
    throw new Error("Unknown nationality. Use an ISO code or a value from /api/v1/meta/nationalities");
  }
  const region = params.get("region") ? regionFromCode(params.get("region")!) : undefined;
  const date = params.get("date");
  const from = params.get("from");
  const to = params.get("to");
  const sort = params.get("sort") === "date" ? "date" as const : "score" as const;
  const hasExplicitDate = Boolean(date || from || to);
  const effectiveFreshnessHours = nationalityCodes.length
    ? Math.min(Math.max(1, limits.newsMaxAgeHours), Math.max(1, limits.nationalityMaxAgeHours))
    : Math.max(1, limits.newsMaxAgeHours);

  for (const [name, value] of [["date", date], ["from", from], ["to", to]]) {
    if (value && !datePattern.test(value)) throw new Error(`${name} must be YYYY-MM-DD`);
  }
  if (!Number.isFinite(limit) || !Number.isFinite(offset)) throw new Error("Invalid pagination");

  const where: Prisma.ArticleWhereInput = {};
  const andFilters: Prisma.ArticleWhereInput[] = [];
  if (categories.length) where.category = { in: categories };
  if (countries.length) where.country = { in: countries };
  if (sources.length) where.source = { code: { in: sources } };
  if (language) where.language = language;
  if (region) where.region = region;
  if (searchText) {
    const variants = options.searchVariants?.length ? options.searchVariants : [searchText];
    const variantFilters = variants.map((variant): Prisma.ArticleWhereInput => ({
      AND: searchWords(variant).map((word) => {
        const fields: Prisma.ArticleWhereInput[] = [];
        if (searchIn !== "summary") {
          fields.push(
            { title: { contains: word } },
            { displayTitle: { contains: word } },
            { titleEn: { contains: word } },
            { titleAr: { contains: word } },
          );
        }
        if (searchIn !== "title") {
          fields.push(
            { summary: { contains: word } },
            { displaySummary: { contains: word } },
            { summaryEn: { contains: word } },
            { summaryAr: { contains: word } },
          );
        }
        for (const code of countryCodesForSearchWord(word)) {
          fields.push({ country: code });
        }
        return { OR: fields };
      }),
    }));
    andFilters.push({ OR: variantFilters });
  }
  if (nationalityCodes.length) {
    andFilters.push({
      OR: nationalityCodes.map((code) => ({ audienceCodes: { contains: `|${code}|` } })),
    });
  }

  const rangeStart = date || from;
  const rangeEnd = date || to;
  if (rangeStart || rangeEnd) {
    where.publishedAt = {};
    if (rangeStart) where.publishedAt.gte = new Date(`${rangeStart}T00:00:00+03:00`);
    if (rangeEnd) {
      const next = new Date(`${rangeEnd}T00:00:00+03:00`);
      next.setUTCDate(next.getUTCDate() + 1);
      where.publishedAt.lt = next;
    }
  } else if (applyDefaultFreshness) {
    where.publishedAt = {
      gte: new Date(new Date().getTime() - effectiveFreshnessHours * 60 * 60 * 1000),
    };
  }
  if (andFilters.length) where.AND = andFilters;

  return {
    where,
    limit,
    offset,
    sort,
    filters: {
      category: params.get("category"),
      country: params.get("country"),
      source: params.get("source"),
      language: language || null,
      lang,
      q: searchText || null,
      searchVariants: options.searchVariants ?? (searchText ? [searchText] : []),
      searchIn,
      nationality: params.getAll("nationality"),
      nationalityCodes,
      freshnessHours: hasExplicitDate || !applyDefaultFreshness ? null : effectiveFreshnessHours,
      region: params.get("region"),
      date,
      from,
      to,
      sort,
    },
  };
}

type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: { source: true; score: true };
}>;

export async function serializeArticles(
  articles: ArticleWithRelations[],
  lang = "ar",
  options: { ranked?: boolean } = {},
) {
  const localized = await localizeFetchedArticles(articles, lang);
  return localized.map((article, index) => (
    serializeArticle(article, options.ranked ? index + 1 : undefined, lang)
  ));
}

export function serializeArticle(article: ArticleWithRelations, rank?: number, lang = "ar") {
  const nationalityCodes = audienceCodesFromValue(article.audienceCodes);
  const localized = articleLocalizedText(article, lang);
  return {
    id: article.id,
    ...(rank ? { rank } : {}),
    category: categoryToCode(article.category),
    secondaryTags: article.secondaryTags
      .split(",")
      .filter(Boolean)
      .filter((value): value is Category => Object.values(Category).includes(value as Category))
      .map(categoryToCode),
    country: article.country,
    region: regionToCode(article.region),
    nationalityCodes,
    nationalityAudiences: nationalityCodes.map((code) => {
      const option = optionForCode(code);
      return option ? {
        code: option.code,
        country: option.country,
        nationality: option.nationality,
      } : { code };
    }),
    title: localized.title,
    summary: localized.summary,
    titleEn: (isEnglishText(article.titleEn) ? article.titleEn : null)
      || (isEnglishText(article.displayTitle) ? article.displayTitle : null)
      || (isEnglishText(article.title) ? article.title : null),
    titleAr: (isArabicText(article.titleAr) ? article.titleAr : null)
      || (isArabicText(article.title) ? article.title : null),
    summaryEn: (isEnglishText(article.summaryEn) ? article.summaryEn : null)
      || (isEnglishText(article.displaySummary) ? article.displaySummary : null)
      || (isEnglishText(article.summary) ? article.summary : null),
    summaryAr: (isArabicText(article.summaryAr) ? article.summaryAr : null)
      || (isArabicText(article.summary) ? article.summary : null),
    originalTitle: article.title,
    originalSummary: article.summary,
    editorialized: Boolean(article.editorializedAt),
    translated: Boolean(article.translatedAt) || isBilingualComplete(article),
    url: article.url,
    imageUrl: optimizedFetchUrl(article.imageUrl, { width: 1200 }) || article.imageUrl,
    source: article.publisher || article.source.name,
    discoveredBy: article.publisher ? article.source.name : null,
    publishedAt: article.publishedAt.toISOString(),
    scores: article.score ? {
      final: article.score.finalScore,
      relevance: article.score.relevance,
      goldImpact: article.score.goldImpact,
      usdImpact: article.score.usdImpact,
      ratesImpact: article.score.ratesImpact,
      oilImpact: article.score.oilImpact,
      marketImpact: article.score.marketImpact,
    } : null,
  };
}
