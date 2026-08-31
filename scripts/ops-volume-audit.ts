/**
 * Rolling 72h volume audit — hourly ingest rate, job health, rejection yield.
 * Usage: npm run ops:volume-audit:live
 */
import { prisma } from "../src/lib/prisma";
import { limits } from "../src/lib/limits";

async function main() {
  const hours = Math.max(1, limits.newsMaxAgeHours);
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    windowCounts,
    newest,
    hourly,
    jobs,
    sourceHealth,
    bilingual,
  ] = await Promise.all([
    prisma.$queryRaw<Array<{ h24: bigint; h48: bigint; h72: bigint }>>`
      SELECT
        COUNT(*) FILTER (WHERE "publishedAt" >= NOW() - INTERVAL '24 hours') AS h24,
        COUNT(*) FILTER (WHERE "publishedAt" >= NOW() - INTERVAL '48 hours') AS h48,
        COUNT(*) FILTER (WHERE "publishedAt" >= NOW() - INTERVAL '72 hours') AS h72
      FROM "Article"
    `,
    prisma.article.aggregate({
      _max: { publishedAt: true, createdAt: true },
    }),
    prisma.$queryRaw<Array<{ hour: Date; articles: bigint }>>`
      SELECT date_trunc('hour', "createdAt") AS hour, COUNT(*)::bigint AS articles
      FROM "Article"
      WHERE "createdAt" >= NOW() - INTERVAL '48 hours'
      GROUP BY 1 ORDER BY 1 DESC LIMIT 24
    `,
    prisma.scheduledJob.findMany({
      orderBy: { key: "asc" },
      select: {
        key: true,
        lastStatus: true,
        lastRunAt: true,
        lastError: true,
        lastSummary: true,
        lockedUntil: true,
      },
    }),
    prisma.source.groupBy({
      by: ["enabled"],
      where: { enabled: true },
      _count: { _all: true },
    }).then(async () => {
      const [enabled, withError, staleFetch] = await Promise.all([
        prisma.source.count({ where: { enabled: true } }),
        prisma.source.count({ where: { enabled: true, lastError: { not: null } } }),
        prisma.source.count({
          where: {
            enabled: true,
            OR: [
              { lastFetchedAt: null },
              { lastFetchedAt: { lt: dayAgo } },
            ],
          },
        }),
      ]);
      return { enabled, withError, staleFetch };
    }),
    prisma.$queryRaw<Array<{ total: bigint; bilingual: bigint }>>`
      SELECT
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (
          WHERE "titleAr" IS NOT NULL AND btrim("titleAr") <> ''
            AND "titleEn" IS NOT NULL AND btrim("titleEn") <> ''
        )::bigint AS bilingual
      FROM "Article"
      WHERE "publishedAt" >= ${cutoff}
    `,
  ]);

  const counts = windowCounts[0];
  const createdLast24h = hourly.reduce((sum, row) => sum + Number(row.articles), 0);
  const avgHourly = hourly.length ? Math.round(createdLast24h / hourly.length) : 0;
  const target72h = avgHourly * hours;

  console.log(JSON.stringify({
    freshnessHours: hours,
    articles: {
      last24h: Number(counts?.h24 ?? 0),
      last48h: Number(counts?.h48 ?? 0),
      last72h: Number(counts?.h72 ?? 0),
      newestPublishedAt: newest._max.publishedAt?.toISOString() ?? null,
      newestCreatedAt: newest._max.createdAt?.toISOString() ?? null,
    },
    ingestRate: {
      createdLast48hByHour: hourly.map((row) => ({
        hour: row.hour.toISOString(),
        articles: Number(row.articles),
      })),
      avgCreatedPerHour: avgHourly,
      projected72hAtCurrentRate: target72h,
      steadyStateTarget: 3600,
    },
    bilingual: {
      inWindow: Number(bilingual[0]?.total ?? 0),
      complete: Number(bilingual[0]?.bilingual ?? 0),
    },
    sources: sourceHealth,
    jobs: jobs.map((job) => ({
      key: job.key,
      lastStatus: job.lastStatus,
      lastRunAt: job.lastRunAt?.toISOString() ?? null,
      lockedUntil: job.lockedUntil?.toISOString() ?? null,
      lastError: job.lastError,
      lastSummary: job.lastSummary,
    })),
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
