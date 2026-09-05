import { prisma } from "@/lib/prisma";
import {
  type ArchivedArticle,
  type ArchiveDayManifest,
  archiveRawRetentionDays,
  archiveRetentionDays,
  dayManifestKey,
  dayObjectKey,
  putGzipJsonl,
  putJson,
  r2Configured,
  readDaysIndex,
  writeDaysIndex,
} from "@/lib/archive/r2";

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function kuwaitDayStartUtc(daysAgo: number) {
  // Align prune cutoff to APP_TIMEZONE calendar days (Asia/Kuwait = UTC+3).
  const offsetHours = 3;
  const now = new Date();
  const kuwaitNow = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
  const kuwaitMidnight = Date.UTC(
    kuwaitNow.getUTCFullYear(),
    kuwaitNow.getUTCMonth(),
    kuwaitNow.getUTCDate() - daysAgo,
    0,
    0,
    0,
    0,
  );
  return new Date(kuwaitMidnight - offsetHours * 60 * 60 * 1000);
}

function serializeArticle(row: {
  id: string;
  title: string;
  summary: string;
  titleEn: string | null;
  summaryEn: string | null;
  titleAr: string | null;
  summaryAr: string | null;
  publisher: string | null;
  url: string;
  imageUrl: string | null;
  category: string;
  country: string;
  region: string;
  language: string;
  publishedAt: Date;
  finalScore: number;
  source: { code: string; name: string } | null;
}): ArchivedArticle {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    titleEn: row.titleEn,
    summaryEn: row.summaryEn,
    titleAr: row.titleAr,
    summaryAr: row.summaryAr,
    publisher: row.publisher,
    url: row.url,
    imageUrl: row.imageUrl,
    category: row.category,
    country: row.country,
    region: row.region,
    language: row.language,
    publishedAt: row.publishedAt.toISOString(),
    finalScore: row.finalScore,
    sourceCode: row.source?.code ?? null,
    sourceName: row.source?.name ?? null,
    archivedAt: new Date().toISOString(),
  };
}

export type ArchiveRunResult = {
  ok: boolean;
  skipped?: boolean;
  mode: "archive-and-prune" | "prune-only" | "noop";
  message: string;
  retentionDays: number;
  rawRetentionDays: number;
  cutoffIso: string;
  daysArchived: number;
  articlesArchived: number;
  articlesDeleted: number;
  rawDeleted: number;
};

async function countPrunableRaw(articleCutoff: Date, rawCutoff: Date) {
  const [processedPastRaw, anyPastArticle] = await Promise.all([
    prisma.rawArticle.count({
      where: {
        processedAt: { not: null, lt: rawCutoff },
      },
    }),
    prisma.rawArticle.count({
      where: { publishedAt: { lt: articleCutoff } },
    }),
  ]);
  // Upper bound: rows may match both predicates; callers only need "any work?".
  return Math.max(processedPastRaw, anyPastArticle);
}

async function pruneProcessedRaw(rawCutoff: Date) {
  // Chunk by processedAt so large free-tier DBs do not lock forever.
  let rawDeleted = 0;
  for (;;) {
    const batch = await prisma.rawArticle.findMany({
      where: { processedAt: { not: null, lt: rawCutoff } },
      select: { id: true },
      take: 500,
      orderBy: { processedAt: "asc" },
    });
    if (!batch.length) break;
    const deleted = await prisma.rawArticle.deleteMany({
      where: { id: { in: batch.map((row) => row.id) } },
    });
    rawDeleted += deleted.count;
    if (deleted.count === 0) break;
  }
  return rawDeleted;
}

async function pruneHotWindow(
  articleCutoff: Date,
  rawCutoff: Date,
  articleIds?: string[],
) {
  let articlesDeleted = 0;
  if (articleIds?.length) {
    const chunkSize = 500;
    for (let i = 0; i < articleIds.length; i += chunkSize) {
      const chunk = articleIds.slice(i, i + chunkSize);
      const deleted = await prisma.article.deleteMany({ where: { id: { in: chunk } } });
      articlesDeleted += deleted.count;
    }
  } else {
    // Chunked delete by publishedAt so large windows do not lock forever.
    for (;;) {
      const batch = await prisma.article.findMany({
        where: { publishedAt: { lt: articleCutoff } },
        select: { id: true },
        take: 500,
        orderBy: { publishedAt: "asc" },
      });
      if (!batch.length) break;
      const deleted = await prisma.article.deleteMany({
        where: { id: { in: batch.map((row) => row.id) } },
      });
      articlesDeleted += deleted.count;
      if (deleted.count === 0) break;
    }
  }

  // Aggressive: drop processed RawArticle rows after raw retention (default 2d).
  let rawDeleted = await pruneProcessedRaw(rawCutoff);

  // Safety: any raw (pending or processed) older than the Article hot window.
  const staleRaw = await prisma.rawArticle.deleteMany({
    where: { publishedAt: { lt: articleCutoff } },
  });
  rawDeleted += staleRaw.count;

  return { articlesDeleted, rawDeleted };
}

/**
 * Hot retention for Supabase. With R2 configured: upload day files then prune.
 * Without R2: prune-only so the free DB stays under the size limit.
 * Processed RawArticles use a shorter window (ARCHIVE_RAW_RETENTION_DAYS) to
 * cut egress/disk after normalize — see docs/R2-CLOUDFLARE-SETUP.md.
 */
export async function runArchiveAndPrune(options: {
  dryRun?: boolean;
  prune?: boolean;
} = {}): Promise<ArchiveRunResult> {
  const retentionDays = archiveRetentionDays();
  const rawRetentionDays = archiveRawRetentionDays();
  const cutoff = kuwaitDayStartUtc(retentionDays);
  const rawCutoff = kuwaitDayStartUtc(rawRetentionDays);
  const dryRun = Boolean(options.dryRun);
  const prune = options.prune !== false;
  const useR2 = r2Configured();

  if (!useR2) {
    const overdue = await prisma.article.count({ where: { publishedAt: { lt: cutoff } } });
    const overdueRaw = await countPrunableRaw(cutoff, rawCutoff);
    if (!overdue && !overdueRaw) {
      return {
        ok: true,
        mode: "noop",
        message: `Nothing older than ${retentionDays}d articles / ${rawRetentionDays}d processed raw to prune (R2 not configured).`,
        retentionDays,
        rawRetentionDays,
        cutoffIso: cutoff.toISOString(),
        daysArchived: 0,
        articlesArchived: 0,
        articlesDeleted: 0,
        rawDeleted: 0,
      };
    }
    if (dryRun || !prune) {
      return {
        ok: true,
        mode: "prune-only",
        message: `Dry run: would prune ${overdue} articles (>${retentionDays}d) and up to ${overdueRaw} raw rows (processed >${rawRetentionDays}d or published >${retentionDays}d) (R2 not configured).`,
        retentionDays,
        rawRetentionDays,
        cutoffIso: cutoff.toISOString(),
        daysArchived: 0,
        articlesArchived: 0,
        articlesDeleted: 0,
        rawDeleted: 0,
      };
    }
    const deleted = await pruneHotWindow(cutoff, rawCutoff);
    return {
      ok: true,
      mode: "prune-only",
      message: `R2 not configured; pruned ${deleted.articlesDeleted} hot articles and ${deleted.rawDeleted} raw rows (articles ${retentionDays}d / processed raw ${rawRetentionDays}d). See docs/R2-CLOUDFLARE-SETUP.md.`,
      retentionDays,
      rawRetentionDays,
      cutoffIso: cutoff.toISOString(),
      daysArchived: 0,
      articlesArchived: 0,
      articlesDeleted: deleted.articlesDeleted,
      rawDeleted: deleted.rawDeleted,
    };
  }

  const candidates = await prisma.article.findMany({
    where: { publishedAt: { lt: cutoff } },
    include: { source: { select: { code: true, name: true } } },
    orderBy: { publishedAt: "asc" },
    take: 50_000,
  });

  if (!candidates.length) {
    if (prune && !dryRun) {
      const deleted = await pruneHotWindow(cutoff, rawCutoff);
      return {
        ok: true,
        mode: deleted.rawDeleted || deleted.articlesDeleted ? "archive-and-prune" : "noop",
        message: deleted.rawDeleted
          ? `No articles to archive; deleted ${deleted.rawDeleted} stale raw rows (processed ${rawRetentionDays}d / published ${retentionDays}d).`
          : `Nothing older than ${retentionDays} days to archive.`,
        retentionDays,
        rawRetentionDays,
        cutoffIso: cutoff.toISOString(),
        daysArchived: 0,
        articlesArchived: 0,
        articlesDeleted: deleted.articlesDeleted,
        rawDeleted: deleted.rawDeleted,
      };
    }
    return {
      ok: true,
      mode: "noop",
      message: `Nothing older than ${retentionDays} days to archive.`,
      retentionDays,
      rawRetentionDays,
      cutoffIso: cutoff.toISOString(),
      daysArchived: 0,
      articlesArchived: 0,
      articlesDeleted: 0,
      rawDeleted: 0,
    };
  }

  const byDay = new Map<string, typeof candidates>();
  for (const row of candidates) {
    const key = toDateKey(row.publishedAt);
    const list = byDay.get(key) ?? [];
    list.push(row);
    byDay.set(key, list);
  }

  const index = await readDaysIndex();
  const indexByDate = new Map(index.map((row) => [row.date, row]));
  let articlesArchived = 0;
  let daysArchived = 0;
  const archivedIds: string[] = [];

  for (const [date, rows] of [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const payload = rows.map(serializeArticle);
    const lines = payload.map((item) => JSON.stringify(item));
    const key = dayObjectKey(date);
    if (!dryRun) {
      const bytes = await putGzipJsonl(key, lines);
      const manifest: ArchiveDayManifest = {
        date,
        articleCount: payload.length,
        key,
        bytes,
        createdAt: new Date().toISOString(),
      };
      await putJson(dayManifestKey(date), manifest);
      indexByDate.set(date, manifest);
    }
    articlesArchived += payload.length;
    daysArchived += 1;
    archivedIds.push(...rows.map((row) => row.id));
  }

  if (!dryRun) {
    await writeDaysIndex([...indexByDate.values()]);
  }

  let articlesDeleted = 0;
  let rawDeleted = 0;
  if (prune && !dryRun && archivedIds.length) {
    const deleted = await pruneHotWindow(cutoff, rawCutoff, archivedIds);
    articlesDeleted = deleted.articlesDeleted;
    rawDeleted = deleted.rawDeleted;
  }

  return {
    ok: true,
    mode: "archive-and-prune",
    message: dryRun
      ? `Dry run: would archive ${articlesArchived} articles across ${daysArchived} days (cutoff ${cutoff.toISOString()}).`
      : `Archived ${articlesArchived} articles across ${daysArchived} days; deleted ${articlesDeleted} hot rows and ${rawDeleted} raw rows.`,
    retentionDays,
    rawRetentionDays,
    cutoffIso: cutoff.toISOString(),
    daysArchived,
    articlesArchived,
    articlesDeleted: dryRun ? 0 : articlesDeleted,
    rawDeleted: dryRun ? 0 : rawDeleted,
  };
}
