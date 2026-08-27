import {
  type ArchivedArticle,
  type ArchiveDayManifest,
  r2Configured,
  readDayArticles,
  readDaysIndex,
} from "@/lib/archive/r2";

export type ArchiveListResult = {
  configured: boolean;
  days: ArchiveDayManifest[];
};

export type ArchiveDayQuery = {
  date: string;
  q?: string;
  lang?: "ar" | "en";
  limit?: number;
  offset?: number;
  country?: string;
  category?: string;
};

function matchesQuery(article: ArchivedArticle, q: string, lang: "ar" | "en") {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const title = lang === "ar"
    ? (article.titleAr || article.title || "")
    : (article.titleEn || article.title || "");
  const summary = lang === "ar"
    ? (article.summaryAr || article.summary || "")
    : (article.summaryEn || article.summary || "");
  return `${title} ${summary} ${article.publisher || ""} ${article.country}`.toLowerCase().includes(needle);
}

export function displayArchivedArticle(article: ArchivedArticle, lang: "ar" | "en" = "ar") {
  const title = lang === "en"
    ? (article.titleEn || article.title)
    : (article.titleAr || article.title);
  const summary = lang === "en"
    ? (article.summaryEn || article.summary)
    : (article.summaryAr || article.summary);
  return { ...article, title, summary };
}

export async function listArchiveDays(): Promise<ArchiveListResult> {
  if (!r2Configured()) return { configured: false, days: [] };
  const days = await readDaysIndex();
  return { configured: true, days };
}

export async function queryArchiveDay(input: ArchiveDayQuery) {
  if (!r2Configured()) {
    return {
      configured: false as const,
      date: input.date,
      total: 0,
      items: [] as ReturnType<typeof displayArchivedArticle>[],
    };
  }
  const lang = input.lang === "en" ? "en" : "ar";
  const limit = Math.min(200, Math.max(1, input.limit ?? 50));
  const offset = Math.max(0, input.offset ?? 0);
  const all = await readDayArticles(input.date);
  const filtered = all.filter((article) => {
    if (input.country && article.country !== input.country) return false;
    if (input.category && article.category !== input.category) return false;
    if (input.q && !matchesQuery(article, input.q, lang)) return false;
    return true;
  }).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.finalScore - a.finalScore);

  return {
    configured: true as const,
    date: input.date,
    total: filtered.length,
    items: filtered.slice(offset, offset + limit).map((row) => displayArchivedArticle(row, lang)),
  };
}

export async function findArchivedArticleById(id: string, lang: "ar" | "en" = "ar") {
  if (!r2Configured()) return null;
  const { days } = await listArchiveDays();
  for (const day of days) {
    const articles = await readDayArticles(day.date);
    const hit = articles.find((row) => row.id === id);
    if (hit) return displayArchivedArticle(hit, lang);
  }
  return null;
}
