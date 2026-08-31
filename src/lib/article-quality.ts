import type { Category } from "@prisma/client";
import {
  calculateScores,
  classifyArticle,
  shouldStoreArticle,
} from "./classify";
import { isBlockedContent } from "./content-safety";
import { limits } from "./limits";
import { prisma } from "./prisma";

export type ArticleQualityInput = {
  title: string;
  summary: string;
  defaultCategory: Category | null;
  sourceCountry: string;
  sourceAdapter: string;
  audienceCodes: string | null;
  sourceQuality: number;
  publishedAt: Date;
};

/** Mirrors normalize/store gates so existing rows can be re-evaluated. */
export function shouldKeepStoredArticle(input: ArticleQualityInput) {
  if (isBlockedContent(input.title, input.summary)) {
    return false;
  }
  const classified = classifyArticle(input.title, input.summary, input.defaultCategory, {
    countryLocked: input.sourceCountry !== "GLOBAL",
  });
  const nationalityNews =
    input.sourceAdapter === "gemini-nationality-search" && Boolean(input.audienceCodes);
  if (!classified.accepted && !nationalityNews) {
    return false;
  }
  const relevance = nationalityNews ? Math.max(45, classified.relevance) : classified.relevance;
  const scores = calculateScores({
    text: `${input.title} ${input.summary}`,
    relevance,
    sourceQuality: input.sourceQuality,
    publishedAt: input.publishedAt,
  });
  if (nationalityNews) return true;
  return shouldStoreArticle(classified, scores, {
    sourceQuality: input.sourceQuality,
    defaultCategory: input.defaultCategory,
    sourceCountry: input.sourceCountry,
  });
}

export async function purgeLowQualityArticles(options: {
  freshnessHours?: number;
  batchSize?: number;
  maxDeletes?: number;
} = {}) {
  const freshnessHours = Math.max(1, options.freshnessHours ?? limits.newsMaxAgeHours);
  const batchSize = Math.max(1, options.batchSize ?? 200);
  const maxDeletes = Math.max(1, options.maxDeletes ?? 2000);
  const cutoff = new Date(Date.now() - freshnessHours * 60 * 60 * 1000);
  let scanned = 0;
  let purged = 0;
  let cursor: string | undefined;

  while (scanned < maxDeletes) {
    const rows = await prisma.article.findMany({
      where: { publishedAt: { gte: cutoff } },
      include: {
        source: { select: { country: true, defaultCategory: true, adapter: true, qualityWeight: true } },
      },
      orderBy: { id: "asc" },
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (!rows.length) break;

    const rejectIds: string[] = [];
    for (const row of rows) {
      scanned += 1;
      if (shouldKeepStoredArticle({
        title: row.title,
        summary: row.summary,
        defaultCategory: row.source.defaultCategory,
        sourceCountry: row.source.country,
        sourceAdapter: row.source.adapter,
        audienceCodes: row.audienceCodes,
        sourceQuality: row.source.qualityWeight,
        publishedAt: row.publishedAt,
      })) {
        continue;
      }
      rejectIds.push(row.id);
      purged += 1;
      if (purged >= maxDeletes) break;
    }

    if (rejectIds.length) {
      await prisma.article.deleteMany({ where: { id: { in: rejectIds } } });
    }

    cursor = rows.at(-1)?.id;
    if (rows.length < batchSize || purged >= maxDeletes) break;
  }

  return { scanned, purged, freshnessHours };
}
