import { prisma } from "../src/lib/prisma";
import { getBilingualCoverage } from "../src/lib/article-translation";
import { countPendingRawArticles } from "../src/lib/pipeline";
import { getScheduleSnapshot } from "../src/lib/scheduler";
import { limits } from "../src/lib/limits";

async function main() {
  const now = new Date();
  const freshnessCutoff = new Date(Date.now() - Math.max(1, limits.newsMaxAgeHours) * 60 * 60 * 1000);
  const [snapshot, bilingual, pendingRaw, pendingArticles] = await Promise.all([
    getScheduleSnapshot(),
    getBilingualCoverage(freshnessCutoff),
    countPendingRawArticles(),
    prisma.article.count({
      where: {
        publishedAt: { gte: freshnessCutoff },
        translatedAt: null,
      },
    }),
  ]);

  const jobs = snapshot.jobs.map((job) => ({
    key: job.key,
    running: job.running,
    lastStatus: job.lastStatus,
    lastRunAt: job.lastRunAt,
    lastError: job.lastError,
    stale: job.running,
  }));

  console.log(JSON.stringify({
    at: now.toISOString(),
    jobs,
    pendingRawArticles: pendingRaw,
    pendingTranslationArticles: pendingArticles,
    bilingual,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
