import { prisma } from "../src/lib/prisma";

const start = new Date("2026-08-23T00:00:00Z");

async function main() {
  const enabled = await prisma.source.count({ where: { enabled: true } });
  const fetchedToday = await prisma.source.count({
    where: { enabled: true, lastFetchedAt: { gte: start } },
  });
  const staleSources = await prisma.source.findMany({
    where: {
      enabled: true,
      OR: [{ lastFetchedAt: null }, { lastFetchedAt: { lt: start } }],
    },
    select: { code: true, lastFetchedAt: true, lastError: true },
  });
  const articlesToday = await prisma.article.count({
    where: { publishedAt: { gte: start } },
  });
  const missingArabic = await prisma.article.count({
    where: {
      publishedAt: { gte: start },
      OR: [{ titleAr: null }, { titleAr: "" }],
    },
  });
  const collectJob = await prisma.scheduledJob.findUnique({
    where: { key: "collect" },
    select: {
      lastStatus: true,
      lockedUntil: true,
      lastRunAt: true,
      lastError: true,
      lastSummary: true,
    },
  });
  const nationality = await prisma.source.findUnique({
    where: { code: "GOOGLE_NATIONALITY_NEWS" },
    select: { lastFetchedAt: true, lastError: true },
  });
  const recentFetch = await prisma.source.findFirst({
    orderBy: { lastFetchedAt: "desc" },
    select: { code: true, lastFetchedAt: true },
  });
  console.log(
    JSON.stringify(
      {
        enabled,
        fetchedToday,
        staleSources,
        articlesToday,
        missingArabic,
        collectJobStatus: collectJob?.lastStatus ?? null,
        collectJob,
        nationality,
        recentFetch,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
