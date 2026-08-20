import { createHash } from "node:crypto";
import type { Category } from "@prisma/client";

/** Strip digits and percentages so rate/figure variants map to the same story. */
export function normalizeStoryText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u0660-\u0669\u06f0-\u06f9\u07c0-\u07c9\u08a0-\u08ff]/g, " ")
    .replace(/\d+(?:[.,]\d+)?%?/g, " ")
    .replace(/\b(?:نقطة|نقاط|basis points?|bps)\b/gi, " ")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function storyKey(title: string) {
  const normalized = normalizeStoryText(title);
  if (!normalized) return "";
  return createHash("sha256").update(normalized).digest("hex").slice(0, 32);
}

export function publisherKey(publisher?: string | null, sourceName?: string) {
  return (publisher || sourceName || "").toLowerCase().replace(/\s+/g, " ").trim();
}

export type StoryArticle = {
  id: string;
  title: string;
  summary?: string;
  publisher?: string | null;
  country: string;
  category: Category | string;
  publishedAt: Date;
  source?: { name: string };
  score?: { finalScore: number } | null;
};

export function storyGroupKey(article: StoryArticle) {
  const day = article.publishedAt.toISOString().slice(0, 10);
  const publisher = publisherKey(article.publisher, article.source?.name);
  return `${storyKey(article.title)}|${publisher}|${article.country}|${article.category}|${day}`;
}

function articleRank(article: StoryArticle) {
  return article.score?.finalScore ?? 0;
}

/** Keep the highest-scored article per story group, preserving incoming order. */
export function dedupeArticles<T extends StoryArticle>(articles: T[]): T[] {
  const bestByGroup = new Map<string, T>();
  const order: string[] = [];

  for (const article of articles) {
    const group = storyGroupKey(article);
    const existing = bestByGroup.get(group);
    if (!existing) {
      bestByGroup.set(group, article);
      order.push(group);
      continue;
    }
    if (articleRank(article) > articleRank(existing)) {
      bestByGroup.set(group, article);
    }
  }

  return order.map((group) => bestByGroup.get(group)!);
}

export const STORY_DEDUPE_WINDOW_HOURS = 72;

export function storyDuplicateWindow(publishedAt: Date) {
  const windowMs = STORY_DEDUPE_WINDOW_HOURS * 60 * 60 * 1000;
  return {
    gte: new Date(publishedAt.getTime() - windowMs),
    lte: new Date(publishedAt.getTime() + windowMs),
  };
}
