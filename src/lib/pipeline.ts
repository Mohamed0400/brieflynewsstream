import { createHash } from "node:crypto";
import { Category, Prisma, Region, type Source } from "@prisma/client";
import { prisma } from "./prisma";
import { collectSource, isTrustedGroundedUrl } from "./adapters";
import { translatePendingArticles, seedBilingualFields, isArabicText } from "./article-translation";
import { editorializeArticles } from "./editorial";
import {
  calculateScores,
  classifyArticle,
  cleanText,
  detectCountry,
  regionForCountry,
} from "./classify";
import {
  allLiveCountrySources,
  countriesNeedingArticles,
  googleNewsRssUrl,
} from "./country-sources";
import { catalogCountryCodes } from "./countries";
import { syncLiveCountrySources } from "./source-sync";
import {
  dedupeArticles,
  storyDuplicateWindow,
  storyKey,
} from "./dedupe";
import { categoryToCode, kuwaitDate } from "./market";
import { limits } from "./limits";
import { audienceValue } from "./nationalities";

export type PipelineResult = {
  sourcesOk: number;
  sourcesFailed: number;
  rawCollected: number;
  articlesCreated: number;
  rejected: number;
  translated: number;
  editionItems: number;
  errors: Array<{ source: string; error: string }>;
};

/** Safety cap on repeated translate batches per run; each pass covers TRANSLATE_BATCH_SIZE articles. */
export const MAX_TRANSLATION_PASSES = 10;

function contentHash(title: string) {
  const normalized = title.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim();
  return createHash("sha256").update(normalized).digest("hex");
}

async function mapPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  const size = Math.max(1, Math.min(concurrency, Math.max(1, queue.length)));
  await Promise.all(Array.from({ length: size }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) return;
      await worker(item);
    }
  }));
}

export async function ensureLiveSources() {
  await syncLiveCountrySources(allLiveCountrySources());
}

async function storeCollectedItems(source: Source, items: Awaited<ReturnType<typeof collectSource>>) {
  for (const item of items) {
    await prisma.rawArticle.upsert({
      where: {
        sourceId_externalId: {
          sourceId: source.id,
          externalId: item.externalId.slice(0, 500),
        },
      },
      create: { sourceId: source.id, ...item, externalId: item.externalId.slice(0, 500) },
      update: {
        title: item.title,
        summary: item.summary,
        publisher: item.publisher,
        audienceCodes: item.audienceCodes ?? "",
        imageUrl: item.imageUrl,
        publishedAt: item.publishedAt,
        rawJson: item.rawJson,
        processedAt: null,
      },
    });
  }
}

async function collectOneSource(source: Source, result: PipelineResult, forceCollect = false) {
  const searchIntervalHours = source.adapter === "gemini-nationality-search"
    ? limits.nationalitySearchIntervalHours
    : 6;
  if (
    !forceCollect &&
    (source.adapter === "gemini-search" || source.adapter === "gemini-nationality-search") &&
    source.lastFetchedAt &&
    !source.lastError &&
    Date.now() - source.lastFetchedAt.getTime() < searchIntervalHours * 60 * 60 * 1000
  ) {
    result.sourcesOk += 1;
    return;
  }
  try {
    const items = await collectSource(source);
    await storeCollectedItems(source, items);
    result.sourcesOk += 1;
    result.rawCollected += items.length;
    await prisma.source.update({
      where: { id: source.id },
      data: { lastFetchedAt: new Date(), lastError: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.sourcesFailed += 1;
    result.errors.push({ source: source.name, error: message });
    await prisma.source.update({
      where: { id: source.id },
      data: { lastFetchedAt: new Date(), lastError: message.slice(0, 1000) },
    });
  }
}

async function collectAll(result: PipelineResult, forceCollect = false) {
  const sources = await prisma.source.findMany({ where: { enabled: true } });
  const gemini = sources.filter((source) => source.adapter.startsWith("gemini"));
  const standard = sources.filter((source) => !source.adapter.startsWith("gemini"));
  await mapPool(standard, limits.collectConcurrency, (source) => (
    collectOneSource(source, result, forceCollect)
  ));
  for (const source of gemini) {
    await collectOneSource(source, result, forceCollect);
  }
}

async function liveCountryCounts(since: Date) {
  const rows = await prisma.article.groupBy({
    by: ["country"],
    where: { publishedAt: { gte: since } },
    _count: { id: true },
  });
  return new Map(rows.map((row) => [row.country, row._count.id]));
}

async function fillThinCountries(result: PipelineResult) {
  const since = new Date(Date.now() - Math.max(1, limits.newsMaxAgeHours) * 60 * 60 * 1000);
  const catalog = [...catalogCountryCodes(), "EU"];
  const thin = countriesNeedingArticles(catalog, await liveCountryCounts(since), limits.minCountryArticles);
  if (!thin.length) return;

  const sources = await prisma.source.findMany({
    where: {
      enabled: true,
      country: { in: thin },
      adapter: "rss",
    },
  });
  const preferred = new Map<string, Source[]>();
  for (const source of sources) {
    const list = preferred.get(source.country) ?? [];
    list.push(source);
    preferred.set(source.country, list);
  }

  await mapPool(thin, Math.min(4, limits.collectConcurrency), async (country) => {
    const existing = preferred.get(country) ?? [];
    const gnews = existing.filter((source) => source.code.startsWith("GNEWS_"));
    const targets = (gnews.length ? gnews : existing).slice(0, 3);
    if (!targets.length) {
      const seeded = allLiveCountrySources().find((source) => source.country === country);
      if (!seeded) return;
      const row = await prisma.source.upsert({
        where: { code: seeded.code },
        create: seeded,
        update: { url: seeded.url, enabled: true },
      });
      targets.push(row);
    }
    for (const source of targets) {
      await collectOneSource(source, result, true);
    }
  });

  await normalizePending(result);

  const stillThin = countriesNeedingArticles(catalog, await liveCountryCounts(since), limits.minCountryArticles);
  await mapPool(stillThin, Math.min(4, limits.collectConcurrency), async (country) => {
    const code = `GNEWS_${country}_WIDE`;
    const url = googleNewsRssUrl(`${country} (economy OR business OR markets OR bank OR government OR oil)`);
    const template = allLiveCountrySources().find((source) => source.country === country);
    const source = await prisma.source.upsert({
      where: { code },
      create: {
        code,
        name: `${country} Coverage`,
        url,
        homepageUrl: "https://news.google.com/",
        adapter: "rss",
        country,
        region: template?.region ?? Region.GLOBAL,
        defaultCategory: template?.defaultCategory ?? Category.MARKETS,
        qualityWeight: 66,
      },
      update: { url, enabled: true, name: `${country} Coverage` },
    });
    await collectOneSource(source, result, true);
  });
}

async function normalizePending(result: PipelineResult) {
  const pending = await prisma.rawArticle.findMany({
    where: { processedAt: null },
    include: { source: true },
    orderBy: { publishedAt: "desc" },
    ...(limits.normalizeBatch > 0 ? { take: limits.normalizeBatch } : {}),
  });
  const existingByUrl = new Map(
    pending.length
      ? (await prisma.article.findMany({
          where: { url: { in: pending.map((row) => row.url) } },
          select: {
            id: true,
            url: true,
            title: true,
            titleEn: true,
            titleAr: true,
            summaryEn: true,
            summaryAr: true,
            translatedAt: true,
          },
        })).map((row) => [row.url, row])
      : [],
  );

  for (const raw of pending) {
    const markProcessed = () =>
      prisma.rawArticle.update({ where: { id: raw.id }, data: { processedAt: new Date() } });

    const title = cleanText(raw.title);
    const summary = cleanText(raw.summary).slice(0, 1200);
    const classified = classifyArticle(title, summary, raw.source.defaultCategory, {
      countryLocked: raw.source.country !== "GLOBAL",
    });
    const nationalityNews =
      raw.source.adapter === "gemini-nationality-search" &&
      Boolean(raw.audienceCodes);
    if (!classified.accepted && !nationalityNews) {
      result.rejected += 1;
      await markProcessed();
      continue;
    }

    const hash = contentHash(title);
    const key = storyKey(title);
    const cachedDuplicate = existingByUrl.get(raw.url);
    const duplicate = cachedDuplicate ?? await prisma.article.findFirst({
      where: {
        OR: [
          { url: raw.url },
          { contentHash: hash },
          ...(key ? [{
            storyKey: key,
            sourceId: raw.sourceId,
            publishedAt: storyDuplicateWindow(raw.publishedAt),
          }] : []),
        ],
      },
      select: { id: true, url: true },
    });
    if (duplicate) {
      if (duplicate.url === raw.url) {
        const existing = cachedDuplicate ?? await prisma.article.findUnique({
          where: { id: duplicate.id },
          select: { title: true, titleEn: true, titleAr: true, summaryEn: true, summaryAr: true, translatedAt: true },
        });
        const titleChanged = existing?.title !== title;
        const seeded = seedBilingualFields(title, summary);
        await prisma.article.update({
          where: { id: duplicate.id },
          data: {
            title,
            summary,
            publisher: raw.publisher,
            audienceCodes: raw.audienceCodes,
            imageUrl: raw.imageUrl,
            publishedAt: raw.publishedAt,
            language: seeded.language,
            ...(titleChanged ? {
              titleEn: seeded.titleEn ?? existing?.titleEn,
              summaryEn: seeded.summaryEn ?? existing?.summaryEn,
              titleAr: seeded.titleAr,
              summaryAr: seeded.summaryAr,
              translatedAt: null,
            } : {
              titleEn: existing?.titleEn || seeded.titleEn,
              summaryEn: existing?.summaryEn || seeded.summaryEn,
              titleAr: isArabicText(existing?.titleAr) ? existing?.titleAr : seeded.titleAr,
              summaryAr: isArabicText(existing?.summaryAr) ? existing?.summaryAr : seeded.summaryAr,
            }),
          },
        });
      }
      await markProcessed();
      continue;
    }

    const audienceCountry = raw.audienceCodes.match(/\|([A-Z]{2})\|/)?.[1];
    const country = raw.source.country !== "GLOBAL"
      ? raw.source.country
      : detectCountry(`${title} ${summary}`, audienceCountry || raw.source.country);
    const region = regionForCountry(country, raw.source.region);
    const relevance = nationalityNews ? Math.max(45, classified.relevance) : classified.relevance;
    const scores = calculateScores({
      text: `${title} ${summary}`,
      relevance,
      sourceQuality: raw.source.qualityWeight,
      publishedAt: raw.publishedAt,
    });

    const seeded = seedBilingualFields(title, summary);
    try {
      await prisma.$transaction([
        prisma.article.create({
          data: {
            sourceId: raw.sourceId,
            title,
            summary,
            publisher: raw.publisher,
            audienceCodes: raw.audienceCodes || (country === "GLOBAL" ? "" : audienceValue([country])),
            url: raw.url,
            imageUrl: raw.imageUrl,
            category: nationalityNews && !classified.accepted
              ? (raw.source.defaultCategory ?? Category.MARKETS)
              : classified.category,
            secondaryTags: classified.secondaryTags.join(","),
            country,
            region,
            language: seeded.language,
            titleEn: seeded.titleEn,
            summaryEn: seeded.summaryEn,
            titleAr: seeded.titleAr,
            summaryAr: seeded.summaryAr,
            publishedAt: raw.publishedAt,
            contentHash: hash,
            storyKey: key,
            finalScore: scores.finalScore,
            score: { create: scores },
          },
        }),
        markProcessed(),
      ]);
      result.articlesCreated += 1;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
        throw error;
      }
      await markProcessed();
    }
  }
}

async function fillMissingStoryKeys() {
  const articles = await prisma.article.findMany({
    where: { storyKey: "" },
    select: { id: true, title: true },
    take: 200,
  });
  for (const article of articles) {
    await prisma.article.update({
      where: { id: article.id },
      data: { storyKey: storyKey(article.title) },
    });
  }
}

async function refreshExistingScores() {
  const cutoff = new Date(Date.now() - Math.max(1, limits.newsMaxAgeHours) * 60 * 60 * 1000);
  const articles = await prisma.article.findMany({
    where: { publishedAt: { gte: cutoff } },
    include: { source: true },
    take: 400,
    orderBy: { publishedAt: "desc" },
  });
  for (const article of articles) {
    const nationalityNews = article.source.adapter === "gemini-nationality-search";
    if (
      (article.source.adapter === "gemini-search" || nationalityNews) &&
      !isTrustedGroundedUrl(article.url)
    ) {
      continue;
    }
    const classified = classifyArticle(article.title, article.summary, article.source.defaultCategory, {
      countryLocked: article.source.country !== "GLOBAL",
    });
    if (!classified.accepted && !nationalityNews) {
      continue;
    }
    const audienceCountry = article.audienceCodes.match(/\|([A-Z]{2})\|/)?.[1];
    const country = detectCountry(
      `${article.title} ${article.summary}`,
      audienceCountry || article.source.country,
    );
    const region = regionForCountry(country, article.source.region);
    const relevance = nationalityNews ? Math.max(45, classified.relevance) : classified.relevance;
    const scores = calculateScores({
      text: `${article.title} ${article.summary}`,
      relevance,
      sourceQuality: article.source.qualityWeight,
      publishedAt: article.publishedAt,
    });
    await prisma.article.update({
      where: { id: article.id },
      data: {
        category: nationalityNews && !classified.accepted
          ? (article.source.defaultCategory ?? Category.MARKETS)
          : classified.category,
        secondaryTags: classified.secondaryTags.join(","),
        audienceCodes: article.audienceCodes || (country === "GLOBAL" ? "" : audienceValue([country])),
        country,
        region,
        finalScore: scores.finalScore,
        score: {
          upsert: { create: scores, update: scores },
        },
      },
    });
  }
}

export async function lockPastEditions(today = kuwaitDate()) {
  await prisma.dailyEdition.updateMany({
    where: {
      date: { lt: today },
      locked: false,
      status: "PUBLISHED",
    },
    data: { locked: true },
  });
}

export async function ensureTodaysEdition() {
  const date = kuwaitDate();
  const existing = await prisma.dailyEdition.findUnique({
    where: { date },
    include: { _count: { select: { items: true } } },
  });
  if ((existing?._count.items ?? 0) > 0) {
    return existing!._count.items;
  }
  return buildDailyEdition(date, { force: true, skipEditorial: true });
}

export async function buildDailyEdition(
  date = kuwaitDate(),
  options: { force?: boolean; skipEditorial?: boolean } = {},
) {
  const today = kuwaitDate();
  await lockPastEditions(today);

  const existing = await prisma.dailyEdition.findUnique({ where: { date } });
  if (existing?.locked && !options.force) {
    return existing.itemCount;
  }
  if (date < today && existing?.status === "PUBLISHED" && !options.force) {
    return existing.itemCount;
  }

  const editionEnd = date === today
    ? new Date()
    : new Date(`${date}T23:59:59.999+03:00`);
  const cutoff = new Date(
    editionEnd.getTime() - Math.max(1, limits.newsMaxAgeHours) * 60 * 60 * 1000,
  );
  const candidates = dedupeArticles(await prisma.article.findMany({
    where: {
      publishedAt: { gte: cutoff, lte: editionEnd },
      score: { isNot: null },
    },
    include: { score: true, source: true },
    orderBy: [{ finalScore: "desc" }, { publishedAt: "desc" }],
    ...(limits.dailyCandidates > 0 ? { take: limits.dailyCandidates } : {}),
  }));

  const selected: typeof candidates = [];
  const regionCount = new Map<string, number>();
  const editionSize = Math.max(1, limits.dailyEdition);
  for (const article of candidates) {
    if (selected.length >= editionSize) break;
    const count = regionCount.get(article.region) ?? 0;
    if (limits.dailyRegionCap > 0 && count >= limits.dailyRegionCap) continue;
    selected.push(article);
    regionCount.set(article.region, count + 1);
  }

  if (!options.skipEditorial) {
    await editorializeArticles(selected);
    await translatePendingArticles();
  }

  const top = selected[0];
  const summary = top
    ? `Top ${selected.length}: ${top.title} (${top.publisher || top.source.name})`
    : "No market-moving stories selected.";

  const edition = await prisma.$transaction(async (tx) => {
    const current = await tx.dailyEdition.upsert({
      where: { date },
      create: { date, status: "DRAFT", locked: false },
      update: { status: "DRAFT" },
    });
    await tx.dailyEditionItem.deleteMany({ where: { editionId: current.id } });
    if (selected.length) {
      await tx.dailyEditionItem.createMany({
        data: selected.map((article, index) => ({
          editionId: current.id,
          articleId: article.id,
          rank: index + 1,
          section: categoryToCode(article.category),
        })),
      });
    }
    return tx.dailyEdition.update({
      where: { id: current.id },
      data: {
        status: "PUBLISHED",
        locked: date < today,
        itemCount: selected.length,
        summary,
      },
    });
  });
  return edition.itemCount;
}

export async function runPipeline(options: {
  forceEdition?: boolean;
  forceCollect?: boolean;
  skipTranslation?: boolean;
} = {}): Promise<PipelineResult> {
  const result: PipelineResult = {
    sourcesOk: 0,
    sourcesFailed: 0,
    rawCollected: 0,
    articlesCreated: 0,
    rejected: 0,
    translated: 0,
    editionItems: 0,
    errors: [],
  };
  await ensureLiveSources();
  await collectAll(result, options.forceCollect);
  await normalizePending(result);
  await fillThinCountries(result);
  await normalizePending(result);
  await fillMissingStoryKeys();
  await refreshExistingScores();
  result.editionItems = await buildDailyEdition(kuwaitDate(), { force: options.forceEdition });
  if (!options.skipTranslation) {
    for (let pass = 0; pass < MAX_TRANSLATION_PASSES; pass += 1) {
      const translation = await translatePendingArticles();
      result.translated += translation.translated;
      if (translation.pending === 0 || translation.translated === 0) break;
    }
  }
  return result;
}
