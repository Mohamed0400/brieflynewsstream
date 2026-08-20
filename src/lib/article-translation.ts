import { z } from "zod";
import { prisma } from "./prisma";
import { limits } from "./limits";

const ARABIC_TEXT = /[\u0600-\u06ff]/;
const BATCH_SIZE = 8;

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
    ? "Translate these English financial-news headlines and summaries into professional modern Arabic for a Kuwait-first market news service. Keep facts exact. Preserve names, numbers, currencies, and market terms. Return only JSON."
    : "Translate these Arabic financial-news headlines and summaries into professional modern English for a Kuwait-first market news service. Keep facts exact. Preserve names, numbers, currencies, and market terms. Return only JSON.";
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
    () => translateViaInteractions(items, direction, key),
    ...modelCandidates().map((model) => (
      () => translateViaGenerateContent(items, direction, key, model)
    )),
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
  console.error("Article translation batch failed:", lastError);
  return new Map<string, { title: string; summary: string }>();
}

async function translateDirection(
  items: TranslationInput[],
  direction: "to-ar" | "to-en",
) {
  const translated = new Map<string, { title: string; summary: string }>();
  const batches: TranslationInput[][] = [];
  for (let index = 0; index < items.length; index += BATCH_SIZE) {
    batches.push(items.slice(index, index + BATCH_SIZE));
  }
  for (let index = 0; index < batches.length; index += 2) {
    const maps = await Promise.all(
      batches.slice(index, index + 2).map((batch) => translateBatch(batch, direction)),
    );
    for (const [batchIndex, batchMap] of maps.entries()) {
      const batch = batches[index + batchIndex];
      for (const item of batch) {
        const translatedItem = batchMap.get(item.id);
        if (!translatedItem) continue;
        if (direction === "to-ar" && !isArabicText(translatedItem.title)) continue;
        if (direction === "to-en" && !isEnglishText(translatedItem.title)) continue;
        translated.set(item.id, translatedItem);
      }
    }
  }
  return translated;
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
        || article.displayTitle
        || article.title,
      summary: (isArabicText(article.summaryAr) ? article.summaryAr : null)
        || (isArabicText(summary) ? summary : null)
        || (isArabicText(article.displaySummary) ? article.displaySummary : null)
        || article.displaySummary
        || summary,
    };
  }
  return {
    title: (isEnglishText(article.titleEn) ? article.titleEn : null)
      || (isEnglishText(article.displayTitle) ? article.displayTitle : null)
      || (isEnglishText(article.title) ? article.title : null)
      || article.titleEn
      || article.displayTitle
      || article.title,
    summary: (isEnglishText(article.summaryEn) ? article.summaryEn : null)
      || (isEnglishText(article.displaySummary) ? article.displaySummary : null)
      || (isEnglishText(summary) ? summary : null)
      || article.summaryEn
      || article.displaySummary
      || summary,
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

export async function translatePendingArticles(options: { limit?: number } = {}) {
  const freshnessCutoff = new Date(
    Date.now() - Math.max(1, limits.newsMaxAgeHours) * 60 * 60 * 1000,
  );
  const unlimited = options.limit === 0 || (options.limit === undefined && limits.translateBatch === 0);
  const take = unlimited ? undefined : (options.limit ?? Math.max(1, limits.translateBatch));
  const pool = await prisma.article.findMany({
    where: { publishedAt: { gte: freshnessCutoff } },
    orderBy: { publishedAt: "desc" },
    ...(take ? { take: Math.max(take * 3, take) } : {}),
  });
  const pending = pool.filter((article) => !isBilingualComplete(article)).slice(0, take || pool.length);
  if (!pending.length) return { translated: 0, pending: 0 };

  const needsArabic: TranslationInput[] = [];
  const needsEnglish: TranslationInput[] = [];

  for (const article of pending) {
    const english = canonicalEnglish(article);
    const arabic = canonicalArabic(article);
    if (english && !isArabicText(article.titleAr)) {
      needsArabic.push({
        id: article.id,
        title: english.title,
        summary: english.summary || english.title,
      });
    }
    if (arabic && !isEnglishText(article.titleEn)) {
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
    translated += 1;
    return [prisma.article.update({
      where: { id: article.id },
      data: {
        language: seeded.language,
        ...(titleEn ? { titleEn } : {}),
        ...(summaryEn ? { summaryEn } : {}),
        ...(titleAr ? { titleAr } : {}),
        ...(summaryAr ? { summaryAr } : {}),
        ...(isEnglishText(titleEn) && isArabicText(titleAr) ? { translatedAt: new Date() } : {}),
      },
    })];
  });
  if (updates.length) await prisma.$transaction(updates);
  return { translated, pending: pending.length };
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
