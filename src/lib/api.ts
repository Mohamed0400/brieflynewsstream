import { Category, Prisma } from "@prisma/client";
import { categoryFromCode, categoryToCode, regionFromCode, regionToCode } from "./market";
import { articleLocalizedText, hasArabicDisplay, isArabicText, isBilingualComplete, isEnglishText } from "./article-translation";
import { optimizedFetchUrl } from "./cloudinary";
import { dedupeArticles } from "./dedupe";
import { limits } from "./limits";
import { prisma } from "./prisma";
import {
  audienceCodesFromValue,
  expandNationalityInputs,
  optionForCode,
} from "./nationalities";
import { searchWords, countryCodesForSearchWord } from "./search";
import { PUBLIC_SERVER_ERROR, isInternalError, publicErrorMessage } from "./public-error";
import { publicSourceName } from "./public-source";

const DEDUPE_MAX_SCAN = 400;

const articleListInclude = { source: true, score: true } as const;
type ListedArticle = Prisma.ArticleGetPayload<{ include: typeof articleListInclude }>;

export function searchContains(word: string): Prisma.StringFilter {
  return { contains: word, mode: "insensitive" };
}

export function articleListOrderBy(sort: "date" | "score") {
  return sort === "date"
    ? [{ publishedAt: "desc" as const }]
    : [{ finalScore: "desc" as const }, { publishedAt: "desc" as const }];
}

export async function listDedupedArticles(
  where: Prisma.ArticleWhereInput,
  orderBy: Prisma.ArticleOrderByWithRelationInput[],
  limit: number,
  offset: number,
  options: { lang?: string } = {},
): Promise<{ count: number; items: ListedArticle[] }> {
  const take = Math.min(
    DEDUPE_MAX_SCAN,
    Math.max(120, (Math.max(0, offset) + Math.max(1, limit)) * (options.lang === "ar" ? 6 : 3)),
  );
  const rows = await prisma.article.findMany({
    where,
    include: articleListInclude,
    orderBy,
    take,
  });
  const unique = dedupeArticles(rows);
  const filtered = options.lang === "ar"
    ? unique.filter((article) => hasArabicDisplay(article))
    : unique;
  return {
    count: filtered.length,
    items: filtered.slice(offset, offset + limit),
  };
}

export async function countDedupedArticles(
  where: Prisma.ArticleWhereInput,
  orderBy: Prisma.ArticleOrderByWithRelationInput[],
) {
  const { count } = await listDedupedArticles(where, orderBy, 1, 0);
  return count;
}

export async function fetchDedupedArticles(
  where: Prisma.ArticleWhereInput,
  orderBy: Prisma.ArticleOrderByWithRelationInput[],
  limit: number,
  offset: number,
): Promise<ListedArticle[]> {
  const { items } = await listDedupedArticles(where, orderBy, limit, offset);
  return items;
}

export function describeQueryFailure(error: unknown) {
  if (isInternalError(error)) {
    const raw = error instanceof Error ? error.message : String(error);
    const schemaDrift = /Unknown argument `[^`]+`/.test(raw);
    return {
      status: schemaDrift ? 500 : 503,
      error: "server_error",
      message: schemaDrift
        ? "Database client is out of date. Restart the app server after applying schema changes."
        : PUBLIC_SERVER_ERROR,
    };
  }
  return {
    status: 400,
    error: "invalid_query",
    message: publicErrorMessage(error, "The request could not be processed."),
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
            { title: searchContains(word) },
            { displayTitle: searchContains(word) },
            { titleEn: searchContains(word) },
            { titleAr: searchContains(word) },
          );
        }
        if (searchIn !== "title") {
          fields.push(
            { summary: searchContains(word) },
            { displaySummary: searchContains(word) },
            { summaryEn: searchContains(word) },
            { summaryAr: searchContains(word) },
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
  return articles.map((article, index) => (
    serializeArticle(article, options.ranked ? index + 1 : undefined, lang)
  ));
}

export function publicLanguageFields(article: {
  title: string;
  summary: string;
  displayTitle: string | null;
  displaySummary: string | null;
  titleEn: string | null;
  summaryEn: string | null;
  titleAr: string | null;
  summaryAr: string | null;
}) {
  return {
    arabic: {
      title: (isArabicText(article.titleAr) ? article.titleAr : null)
        || (isArabicText(article.title) ? article.title : null),
      summary: (isArabicText(article.summaryAr) ? article.summaryAr : null)
        || (isArabicText(article.summary) ? article.summary : null),
    },
    english: {
      title: (isEnglishText(article.titleEn) ? article.titleEn : null)
        || (isEnglishText(article.displayTitle) ? article.displayTitle : null)
        || (isEnglishText(article.title) ? article.title : null),
      summary: (isEnglishText(article.summaryEn) ? article.summaryEn : null)
        || (isEnglishText(article.displaySummary) ? article.displaySummary : null)
        || (isEnglishText(article.summary) ? article.summary : null),
    },
  };
}

export function serializeArticle(article: ArticleWithRelations, rank?: number, lang = "ar") {
  const nationalityCodes = audienceCodesFromValue(article.audienceCodes);
  const localized = articleLocalizedText(article, lang);
  const languages = publicLanguageFields(article);
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
    arabic: languages.arabic,
    english: languages.english,
    originalTitle: article.title,
    originalSummary: article.summary,
    editorialized: Boolean(article.editorializedAt),
    translated: Boolean(article.translatedAt) || isBilingualComplete(article),
    url: article.url,
    imageUrl: optimizedFetchUrl(article.imageUrl, { width: 1200 }) || article.imageUrl,
    source: publicSourceName(article.publisher || article.source.name),
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
