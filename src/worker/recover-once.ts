import { prisma } from "../lib/prisma";
import { purgeLowQualityArticles } from "../lib/article-quality";
import { drainPendingTranslations } from "../lib/article-translation";
import { limits } from "../lib/limits";
import {
  countPendingRawArticles,
  drainRawBacklog,
  runPipeline,
  type PipelineResult,
} from "../lib/pipeline";
import {
  clearStaleJobLocks,
  ensureDefaultJobs,
  JOB_COLLECT,
  JOB_TRANSLATE,
  releaseJobLock,
  runScheduledJob,
  shouldClearStaleLock,
} from "../lib/scheduler";

function emptyResult(): PipelineResult {
  return {
    sourcesOk: 0,
    sourcesFailed: 0,
    deferred: 0,
    rawCollected: 0,
    articlesCreated: 0,
    rejected: 0,
    translated: 0,
    editionItems: 0,
    errors: [],
  };
}

async function main() {
  await ensureDefaultJobs();
  const now = new Date();
  const jobsBefore = await prisma.scheduledJob.findMany({
    select: { key: true, lastStatus: true, lastRunAt: true, lockedUntil: true, lastError: true },
    orderBy: { key: "asc" },
  });

  const cleared = await clearStaleJobLocks();
  const running = await prisma.scheduledJob.findMany({
    where: { lastStatus: "running" },
    select: { key: true, lastStatus: true, lockedUntil: true, lastRunAt: true },
  });
  const released: string[] = [];
  for (const job of running) {
    if (shouldClearStaleLock(job, now) || process.argv.includes("--force-locks")) {
      await releaseJobLock(job.key);
      released.push(job.key);
    }
  }

  const rawBefore = await countPendingRawArticles();
  const normalizeResult = rawBefore > 0
    ? await drainRawBacklog(emptyResult(), { maxPasses: limits.normalizeBacklogPasses })
    : { pending: 0, normalized: 0, passes: 0 };

  const translation = await drainPendingTranslations(limits.translateMaxPasses);

  let translateJobSummary: string | null = null;
  if (process.argv.includes("--translate-job")) {
    const translateJob = await runScheduledJob(JOB_TRANSLATE, { force: true });
    translateJobSummary = translateJob.message;
  }

  let collectSummary: string | null = null;
  if (process.argv.includes("--collect")) {
    const collect = await runScheduledJob(JOB_COLLECT, { force: true });
    collectSummary = collect.message;
  }

  let qualityPurge: Awaited<ReturnType<typeof purgeLowQualityArticles>> | null = null;
  if (process.argv.includes("--purge-quality")) {
    qualityPurge = await purgeLowQualityArticles();
  }

  const jobsAfter = await prisma.scheduledJob.findMany({
    select: { key: true, lastStatus: true, lastRunAt: true, lastError: true, lastSummary: true },
    orderBy: { key: "asc" },
  });

  console.log(JSON.stringify({
    jobsBefore,
    clearedStaleLocks: cleared,
    releasedRunningJobs: released,
    rawBefore,
    rawAfter: normalizeResult.pending,
    rawNormalized: normalizeResult.normalized,
    normalizePasses: normalizeResult.passes,
    translated: translation.translated,
    translationPending: translation.pending,
    translateJob: translateJobSummary,
    collect: collectSummary,
    qualityPurge,
    jobsAfter,
  }, null, 2));

  if (translation.pending > 0) {
    console.log("\nTranslation backlog remains. Re-run `npm run recover:live` or `npm run translate:live:all`.");
  }
  if (normalizeResult.pending > 0) {
    console.log("\nRaw normalize backlog remains. Re-run with `--collect` or wait for the next GitHub collect.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
