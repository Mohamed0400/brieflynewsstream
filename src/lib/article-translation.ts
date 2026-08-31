import { z } from "zod";
import { prisma } from "./prisma";
import { limits } from "./limits";

const ARABIC_TEXT = /[\u0600-\u06ff]/;

/** Lower rank = translated first. KW → global → US/EU → CN/TW → GCC/Europe hubs. */
const TRANSLATION_PRIORITY = new Map<string, number>([
  ["KW", 0],
  ["GLOBAL", 1],
  ["US", 2],
  ["EU", 3],
  ["CN", 4],
  ["TW", 5],
  ["HK", 6],
  ["GB", 7],
  ["DE", 8],
  ["FR", 9],
  ["CH", 10],
  ["SA", 11],
  ["AE", 12],
  ["QA", 13],
  ["BH", 14],
  ["OM", 15],
  ["EG", 16],
  ["JO", 17],
  ["IQ", 18],
  ["LB", 19],
  ["PS", 20],
  ["YE", 21],
  ["SY", 22],
  ["LY", 23],
  ["MA", 24],
  ["TN", 25],
  ["DZ", 26],
  ["SD", 27],
  ["JP", 28],
  ["NL", 29],
]);

/** Lower = translate first within the same country bucket. */
const TRANSLATION_CATEGORY_PRIORITY = new Map<string, number>([
  ["GOLD", 0],
  ["OIL", 1],
  ["ENERGY", 2],
  ["COMMODITIES", 3],
  ["CRYPTO", 4],
  ["FINANCE", 5],
  ["FINANCE", 6],
  ["ECONOMICS", 7],
  ["MARKETS", 8],
  ["FX", 9],
  ["BANKING", 10],
  ["TRADE", 11],
  ["ME_ECONOMY", 12],
]);

const articleTranslationSchema = z.object({
  articles: z.array(z.object({
    id: z.string(),
    title: z.string().min(2),
    summary: z.string().min(2),
  })),
});

type TranslationInput = {
  id: string;
  title: string;
  summary: string;
};

type BilingualArticle = {
  id: string;
  title: string;
  summary: string;
  displayTitle: string | null;
  displaySummary: string | null;
  language: string;
  titleEn: string | null;
  summaryEn: string | null;
  titleAr: string | null;
  summaryAr: string | null;
  translatedAt: Date | null;
};

/** Last Gemini/API failure message from a translate batch (spend cap, auth, etc.). */
let lastTranslationFailure: string | null = null;

export function consumeLastTranslationFailure() {
  const value = lastTranslationFailure;
  lastTranslationFailure = null;
  return value;
}

export function isArabicText(value: string | null | undefined) {
  return Boolean(value && ARABIC_TEXT.test(value));
}

export function isEnglishText(value: string | null | undefined) {
  return Boolean(value?.trim() && /[A-Za-z]{2,}/.test(value) && !isArabicText(value));
}

export function detectSourceLanguage(title: string, summary = "") {
  return isArabicText(`${title} ${summary}`) ? "ar" : "en";
}

export function seedBilingualFields(title: string, summary: string) {
  const language = detectSourceLanguage(title, summary);
  const text = title.trim();
  const body = summary.trim() || text;
  if (language === "ar") {
    return {
      language,
      titleAr: text,
      summaryAr: body,
      titleEn: null as string | null,
      summaryEn: null as string | null,
    };
  }
  return {
    language: "en" as const,
    titleEn: text,
    summaryEn: body,
    titleAr: null as string | null,
    summaryAr: null as string | null,
  };
}

export function isBilingualComplete(article: {
  titleEn: string | null;
  summaryEn: string | null;
  titleAr: string | null;
  summaryAr: string | null;
}) {
  return isEnglishText(article.titleEn)
    && isEnglishText(article.summaryEn)
    && isArabicText(article.titleAr)
    && isArabicText(article.summaryAr);
}

export type BilingualCoverage = {
  scanned: number;
  complete: number;
  missingArabic: number;
  missingEnglish: number;
  ok: boolean;
};

export function summarizeBilingualCoverage(articles: Array<{
  titleEn: string | null;
  summaryEn: string | null;
  titleAr: string | null;
  summaryAr: string | null;
}>): BilingualCoverage {
  let complete = 0;
  let missingArabic = 0;
  let missingEnglish = 0;
  for (const article of articles) {
    if (isBilingualComplete(article)) complete += 1;
    if (!isArabicText(article.titleAr) || !isArabicText(article.summaryAr)) missingArabic += 1;
    if (!isEnglishText(article.titleEn) || !isEnglishText(article.summaryEn)) missingEnglish += 1;
  }
  return {
    scanned: articles.length,
    complete,
    missingArabic,
    missingEnglish,
    ok: articles.length === 0 || complete === articles.length,
  };
}

export async function getBilingualCoverage(cutoff: Date): Promise<BilingualCoverage> {
  const articles = await prisma.article.findMany({
    where: { publishedAt: { gte: cutoff } },
    select: {
      titleEn: true,
      summaryEn: true,
      titleAr: true,
      summaryAr: true,
    },
  });
  return summarizeBilingualCoverage(articles);
}

/** Articles in the freshness window that still lack a complete en/ar pair. */
export async function countIncompleteBilingualArticles(cutoff: Date) {
  const articles = await prisma.article.findMany({
    where: { publishedAt: { gte: cutoff } },
    select: {
      titleEn: true,
      summaryEn: true,
      titleAr: true,
      summaryAr: true,
    },
  });
  return articles.filter((article) => !isBilingualComplete(article)).length;
}

/** Mark translatedAt on rows that already have both languages (legacy backlog cleanup). */
export async function backfillTranslatedAt(cutoff: Date) {
  const rows = await prisma.article.findMany({
    where: {
      publishedAt: { gte: cutoff },
      translatedAt: null,
    },
    select: {
      id: true,
      titleEn: true,
      summaryEn: true,
      titleAr: true,
      summaryAr: true,
    },
  });
  const ids = rows.filter((row) => isBilingualComplete(row)).map((row) => row.id);
  if (!ids.length) return 0;
  await prisma.article.updateMany({
    where: { id: { in: ids } },
    data: { translatedAt: new Date() },
  });
  return ids.length;
}

function modelCandidates() {
  return [...new Set([
    process.env.GEMINI_MODEL,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ].filter((value): value is string => Boolean(value)))];
}

function translationSchema(includeAdditionalProperties = true) {
  const objectSchema = {
    type: "object",
    required: ["id", "title", "summary"],
    properties: {
      id: { type: "string" },
      title: { type: "string" },
      summary: { type: "string" },
    },
    ...(includeAdditionalProperties ? { additionalProperties: false } : {}),
  };
  return {
    type: "object",
    required: ["articles"],
    properties: {
      articles: {
        type: "array",
        items: objectSchema,
      },
    },
    ...(includeAdditionalProperties ? { additionalProperties: false } : {}),
  };
}

function extractInteractionsText(payload: {
  steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  output?: Array<{ type?: string; text?: string }> | string;
}) {
  const finalOutput = payload.steps?.filter((step) => step.type === "model_output").at(-1);
  const fromSteps = (finalOutput?.content ?? [])
    .filter((content) => content.type === "text")
    .map((content) => content.text ?? "")
    .join("")
    .trim();
  if (fromSteps) return fromSteps;
  if (typeof payload.output === "string") return payload.output.trim();
  return (payload.output ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

function extractGenerateContentText(payload: {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}) {
  return (payload.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

function parseTranslationJson(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const candidates = [trimmed];
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) candidates.push(trimmed.slice(start, end + 1));
  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      return articleTranslationSchema.parse(JSON.parse(candidate));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Translation JSON parse failed.");
}

function translationPrompt(items: TranslationInput[], direction: "to-ar" | "to-en") {
  const instruction = direction === "to-ar"
    ? "Translate these English financial-news headlines and summaries into professional modern Arabic for a bilingual market news service. Keep facts exact. Preserve names, numbers, currencies, and market terms. Return only JSON."
    : "Translate these Arabic financial-news headlines and summaries into professional modern English for a bilingual market news service. Keep facts exact. Preserve names, numbers, currencies, and market terms. Return only JSON.";
  return `${instruction}\n\nArticles:\n${JSON.stringify(items)}`;
}

async function translateViaInteractions(
  items: TranslationInput[],
  direction: "to-ar" | "to-en",
  key: string,
) {
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": key,
    },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model,
      input: translationPrompt(items, direction),
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: translationSchema(true),
      },
    }),
  });
  const payload = await response.json() as {
    steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
    output?: Array<{ type?: string; text?: string }> | string;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.message || `Gemini interactions ${response.status}`);
  }
  return parseTranslationJson(extractInteractionsText(payload) || "{}");
}

async function translateViaGenerateContent(
  items: TranslationInput[],
  direction: "to-ar" | "to-en",
  key: string,
  model: string,
) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": key,
      },
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: translationPrompt(items, direction) }],
        }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    },
  );
  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.message || `Gemini ${response.status}`);
  }
  return parseTranslationJson(extractGenerateContentText(payload) || "{}");
}

async function translateBatch(
  items: TranslationInput[],
  direction: "to-ar" | "to-en",
) {
  const key = process.env.GOOGLE_API_KEY;
  if (!key || !items.length) return new Map<string, { title: string; summary: string }>();

  const attempts: Array<() => Promise<z.infer<typeof articleTranslationSchema>>> = [
    ...modelCandidates().map((model) => (
      () => translateViaGenerateContent(items, direction, key, model)
    )),
    () => translateViaInteractions(items, direction, key),
  ];

  let lastError = "Translation request failed.";
  for (const attempt of attempts) {
    try {
      const parsed = await attempt();
      return new Map(parsed.articles.map((article) => [article.id, {
        title: article.title.trim(),
        summary: article.summary.trim(),
      }]));
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  lastTranslationFailure = lastError;
  console.error("Article translation batch failed:", lastError);
  return new Map<string, { title: string; summary: string }>();
}

function acceptTranslatedItem(
  translated: Map<string, { title: string; summary: string }>,
  item: TranslationInput,
  direction: "to-ar" | "to-en",
  translatedItem: { title: string; summary: string } | undefined,
) {
  if (!translatedItem) return;
  if (direction === "to-ar" && !isArabicText(translatedItem.title)) return;
  if (direction === "to-en" && !isEnglishText(translatedItem.title)) return;
  translated.set(item.id, translatedItem);
}

async function translateDirection(
  items: TranslationInput[],
  direction: "to-ar" | "to-en",
) {
  const translated = new Map<string, { title: string; summary: string }>();
  const batchSize = Math.max(1, limits.translateItemBatch);
  const concurrency = Math.max(1, limits.translateConcurrency);
  const batches: TranslationInput[][] = [];
  for (let index = 0; index < items.length; index += batchSize) {
    batches.push(items.slice(index, index + batchSize));
  }
  for (let index = 0; index < batches.length; index += concurrency) {
    const maps = await Promise.all(
      batches.slice(index, index + concurrency).map((batch) => translateBatch(batch, direction)),
    );
    for (const [batchIndex, batchMap] of maps.entries()) {
      const batch = batches[index + batchIndex];
      for (const item of batch) {
        acceptTranslatedItem(translated, item, direction, batchMap.get(item.id));
      }
    }
  }

  const missing = items.filter((item) => !translated.has(item.id));
  for (const item of missing) {
    const single = await translateBatch([item], direction);
    acceptTranslatedItem(translated, item, direction, single.get(item.id));
  }
  return translated;
}

export function hasArabicDisplay(
  article: Parameters<typeof articleLocalizedText>[0],
) {
  return Boolean(articleLocalizedText(article, "ar").title.trim());
}

export function hasEnglishDisplay(
  article: Parameters<typeof articleLocalizedText>[0],
) {
  return Boolean(articleLocalizedText(article, "en").title.trim());
}

export function hasLocalizedDisplay(
  article: Parameters<typeof articleLocalizedText>[0],
  lang: string,
) {
  return lang === "en" ? hasEnglishDisplay(article) : hasArabicDisplay(article);
}

export function translationPriority(country: string) {
  return TRANSLATION_PRIORITY.get(country.trim().toUpperCase()) ?? 100;
}

export function translationCategoryPriority(category: string | undefined | null) {
  if (!category) return 50;
  return TRANSLATION_CATEGORY_PRIORITY.get(String(category).trim().toUpperCase()) ?? 40;
}

export function sortArticlesForTranslation<
  T extends { country: string; publishedAt: Date; category?: string | null },
>(articles: T[]) {
  return [...articles].sort((left, right) => {
    const priorityDelta = translationPriority(left.country) - translationPriority(right.country);
    if (priorityDelta !== 0) return priorityDelta;
    const categoryDelta =
      translationCategoryPriority(left.category) - translationCategoryPriority(right.category);
    if (categoryDelta !== 0) return categoryDelta;
    return right.publishedAt.getTime() - left.publishedAt.getTime();
  });
}

export function articleLocalizedText(
  article: {
    language: string;
    title: string;
    summary: string | null;
    displayTitle: string | null;
    displaySummary: string | null;
    titleEn: string | null;
    summaryEn: string | null;
    titleAr: string | null;
    summaryAr: string | null;
  },
  lang: string,
) {
  const summary = article.summary || "";
  if (lang === "ar") {
    return {
      title: (isArabicText(article.titleAr) ? article.titleAr : null)
        || (isArabicText(article.title) ? article.title : null)
        || (isArabicText(article.displayTitle) ? article.displayTitle : null)
        || "",
      summary: (isArabicText(article.summaryAr) ? article.summaryAr : null)
        || (isArabicText(summary) ? summary : null)
        || (isArabicText(article.displaySummary) ? article.displaySummary : null)
        || "",
    };
  }
  return {
    title: (isEnglishText(article.titleEn) ? article.titleEn : null)
      || (isEnglishText(article.displayTitle) ? article.displayTitle : null)
      || (isEnglishText(article.title) ? article.title : null)
      || "",
    summary: (isEnglishText(article.summaryEn) ? article.summaryEn : null)
      || (isEnglishText(article.displaySummary) ? article.displaySummary : null)
      || (isEnglishText(summary) ? summary : null)
      || "",
  };
}

function firstMatching(
  values: Array<string | null | undefined>,
  predicate: (value: string) => boolean,
) {
  return values.find((value): value is string => typeof value === "string" && Boolean(value.trim()) && predicate(value));
}

function canonicalEnglish(article: BilingualArticle) {
  const title = firstMatching(
    [article.titleEn, article.displayTitle, article.title],
    isEnglishText,
  );
  if (!title) return null;
  return {
    title,
    summary: firstMatching(
      [article.summaryEn, article.displaySummary, article.summary, title],
      isEnglishText,
    ) || title,
  };
}

function canonicalArabic(article: BilingualArticle) {
  const title = firstMatching(
    [article.titleAr, article.displayTitle, article.title],
    isArabicText,
  );
  if (!title) return null;
  return {
    title,
    summary: firstMatching(
      [article.summaryAr, article.displaySummary, article.summary, title],
      isArabicText,
    ) || title,
  };
}

/** Prisma filter for rows that are likely missing an en/ar pair (JS still verifies). */
export function likelyIncompleteTranslationWhere(cutoff: Date) {
  return {
    publishedAt: { gte: cutoff },
    OR: [
      { translatedAt: null },
      { titleAr: null },
      { summaryAr: null },
      { titleEn: null },
      { summaryEn: null },
    ],
  };
}

export async function translatePendingArticles(options: { limit?: number; countries?: string[] } = {}) {
  const freshnessCutoff = new Date(
    Date.now() - Math.max(1, limits.newsMaxAgeHours) * 60 * 60 * 1000,
  );
  const unlimited = options.limit === 0 || (options.limit === undefined && limits.translateBatch === 0);
  const take = unlimited ? undefined : (options.limit ?? Math.max(1, limits.translateBatch));
  const countryFilter = options.countries?.map((code) => code.trim().toUpperCase()).filter(Boolean);
  // Pull likely-incomplete rows — NOT merely the newest N articles. After a
  // successful collect the newest window is mostly bilingual, which previously
  // made repair report "0 translated" while hundreds of older rows stayed incomplete.
  const candidateTake = unlimited
    ? undefined
    : Math.min(Math.max((take ?? 80) * 20, 500), 5000);
  const pool = await prisma.article.findMany({
    where: {
      ...likelyIncompleteTranslationWhere(freshnessCutoff),
      ...(countryFilter?.length ? { country: { in: countryFilter } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    ...(candidateTake ? { take: candidateTake } : {}),
  });
  const allPending = sortArticlesForTranslation(pool.filter((article) => !isBilingualComplete(article)));
  const pending = allPending.slice(0, take || allPending.length);
  if (!pending.length) {
    const remaining = await countIncompleteBilingualArticles(freshnessCutoff);
    return { translated: 0, pending: remaining };
  }

  const needsArabic: TranslationInput[] = [];
  const needsEnglish: TranslationInput[] = [];

  for (const article of pending) {
    const english = canonicalEnglish(article);
    const arabic = canonicalArabic(article);
    // Queue when either title or summary is missing for that language.
    if (english && (!isArabicText(article.titleAr) || !isArabicText(article.summaryAr))) {
      needsArabic.push({
        id: article.id,
        title: english.title,
        summary: english.summary || english.title,
      });
    }
    if (arabic && (!isEnglishText(article.titleEn) || !isEnglishText(article.summaryEn))) {
      needsEnglish.push({
        id: article.id,
        title: arabic.title,
        summary: arabic.summary || arabic.title,
      });
    }
  }

  const [arabicTranslations, englishTranslations] = await Promise.all([
    needsArabic.length ? translateDirection(needsArabic, "to-ar") : Promise.resolve(new Map()),
    needsEnglish.length ? translateDirection(needsEnglish, "to-en") : Promise.resolve(new Map()),
  ]);

  let translated = 0;
  const updates = pending.flatMap((article) => {
    const seeded = seedBilingualFields(article.displayTitle || article.title, article.displaySummary || article.summary);
    const translatedAr = arabicTranslations.get(article.id);
    const translatedEn = englishTranslations.get(article.id);
    const titleEn = (isEnglishText(article.titleEn) ? article.titleEn : null)
      || (isEnglishText(seeded.titleEn) ? seeded.titleEn : null)
      || (translatedEn && isEnglishText(translatedEn.title) ? translatedEn.title : null);
    const summaryEn = (isEnglishText(article.summaryEn) ? article.summaryEn : null)
      || (isEnglishText(seeded.summaryEn) ? seeded.summaryEn : null)
      || (translatedEn && isEnglishText(translatedEn.summary) ? translatedEn.summary : null);
    const titleAr = (isArabicText(article.titleAr) ? article.titleAr : null)
      || seeded.titleAr
      || (translatedAr && isArabicText(translatedAr.title) ? translatedAr.title : null);
    const summaryAr = (isArabicText(article.summaryAr) ? article.summaryAr : null)
      || seeded.summaryAr
      || (translatedAr && isArabicText(translatedAr.summary) ? translatedAr.summary : null);

    if (!titleEn && !titleAr) return [];
    const complete = isBilingualComplete({ titleEn, summaryEn, titleAr, summaryAr });
    if (complete) translated += 1;
    return [prisma.article.update({
      where: { id: article.id },
      data: {
        language: seeded.language,
        ...(titleEn ? { titleEn } : {}),
        ...(summaryEn ? { summaryEn } : {}),
        ...(titleAr ? { titleAr } : {}),
        ...(summaryAr ? { summaryAr } : {}),
        ...(complete ? { translatedAt: new Date() } : {}),
      },
    })];
  });
  if (updates.length) await prisma.$transaction(updates);
  const remaining = allPending.length - translated;
  return { translated, pending: remaining > 0 ? remaining : 0 };
}

export async function drainPendingTranslations(maxPasses = limits.translateMaxPasses) {
  let translated = 0;
  let pending = 0;
  let apiError: string | null = null;
  for (let pass = 0; pass < maxPasses; pass += 1) {
    const result = await translatePendingArticles();
    translated += result.translated;
    pending = result.pending;
    apiError = consumeLastTranslationFailure() || apiError;
    if (result.pending === 0 || result.translated === 0) break;
  }
  return { translated, pending, apiError };
}

export async function localizeFetchedArticles<T extends BilingualArticle>(
  articles: T[],
  lang: string,
): Promise<T[]> {
  if (!articles.length) return articles;

  const toArabic = lang !== "en";
  const pending = articles.filter((article) => (
    toArabic ? !isArabicText(article.titleAr) : !isEnglishText(article.titleEn)
  ));
  if (!pending.length) return articles;

  const inputs: TranslationInput[] = pending.map((article) => {
    if (toArabic) {
      const english = canonicalEnglish(article);
      return {
        id: article.id,
        title: english?.title || article.title,
        summary: english?.summary || article.summary || article.title,
      };
    }
    const arabic = canonicalArabic(article);
    return {
      id: article.id,
      title: arabic?.title || article.title,
      summary: arabic?.summary || article.summary || article.title,
    };
  });

  const translated = await translateDirection(inputs, toArabic ? "to-ar" : "to-en");
  if (!translated.size) return articles;

  const byId = new Map(articles.map((article) => [article.id, article]));
  const updates = [];
  for (const article of pending) {
    const result = translated.get(article.id);
    if (!result) continue;
    if (toArabic && !isArabicText(result.title)) continue;
    if (!toArabic && !isEnglishText(result.title)) continue;
    const next = toArabic
      ? {
          ...article,
          titleAr: result.title,
          summaryAr: result.summary,
          translatedAt: isEnglishText(article.titleEn) ? new Date() : article.translatedAt,
        }
      : {
          ...article,
          titleEn: result.title,
          summaryEn: result.summary,
          translatedAt: isArabicText(article.titleAr) ? new Date() : article.translatedAt,
        };
    byId.set(article.id, next);
    updates.push(prisma.article.update({
      where: { id: article.id },
      data: toArabic
        ? {
            titleAr: result.title,
            summaryAr: result.summary,
            ...(next.translatedAt ? { translatedAt: next.translatedAt } : {}),
          }
        : {
            titleEn: result.title,
            summaryEn: result.summary,
            ...(next.translatedAt ? { translatedAt: next.translatedAt } : {}),
          },
    }));
  }
  if (updates.length) await prisma.$transaction(updates);
  return articles.map((article) => byId.get(article.id) ?? article);
}
