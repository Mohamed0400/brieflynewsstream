/**
 * Soft-heal Arabic desk freshness for GitHub Actions.
 * Clears expired/zombie collect-arabic (and collect) locks, then runs Arabic
 * collect only when the feed/job is stale. Never enables MAIN collect.
 *
 * Soft exit: skipped/fresh is success (exit 0). Hard failures exit 1.
 */
import { prisma } from "../lib/prisma";
import { isArabicCollectEnabled } from "../lib/collect-enabled";
import {
  shouldTriggerArabicFreshnessCollect,
  STALE_ARABIC_FEED_MAX_AGE_MS,
  ageMs,
} from "../lib/arabic-watchdog";
import {
  clearStaleJobLocks,
  ensureDefaultJobs,
  JOB_COLLECT_ARABIC,
  runScheduledJob,
} from "../lib/scheduler";

const force = process.argv.includes("--force");

async function main() {
  if (force) {
    process.env.ARABIC_COLLECT_FORCE = "true";
  }

  await ensureDefaultJobs();

  const clearedStaleLocks = await clearStaleJobLocks();
  const now = new Date();

  const [job, newestArabic] = await Promise.all([
    prisma.scheduledJob.findUnique({
      where: { key: JOB_COLLECT_ARABIC },
      select: { lastStatus: true, lastRunAt: true, lockedUntil: true },
    }),
    prisma.article.findFirst({
      where: { language: "ar" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const newestArabicCreatedAt = newestArabic?.createdAt ?? null;
  const feedAgeMs = ageMs(newestArabicCreatedAt, now);
  const base = {
    at: now.toISOString(),
    clearedStaleLocks,
    newestArabicCreatedAt: newestArabicCreatedAt?.toISOString() ?? null,
    newestArabicAgeHours: feedAgeMs != null ? feedAgeMs / 3_600_000 : null,
    staleThresholdHours: STALE_ARABIC_FEED_MAX_AGE_MS / 3_600_000,
    job: job
      ? {
          lastStatus: job.lastStatus,
          lastRunAt: job.lastRunAt?.toISOString() ?? null,
          lockedUntil: job.lockedUntil?.toISOString() ?? null,
        }
      : null,
  };

  if (!isArabicCollectEnabled()) {
    console.log(JSON.stringify({
      ...base,
      ok: true,
      skipped: true,
      triggered: false,
      message: "Arabic collect disabled (ARABIC_COLLECT_ENABLED). Watchdog soft-skip.",
    }, null, 2));
    return;
  }

  const jobState = job ?? { lastStatus: null, lastRunAt: null, lockedUntil: null };
  const shouldCollect = shouldTriggerArabicFreshnessCollect({
    now,
    newestArabicCreatedAt,
    job: jobState,
  });

  if (!shouldCollect) {
    console.log(JSON.stringify({
      ...base,
      ok: true,
      skipped: true,
      triggered: false,
      message: "Arabic feed fresh or collect already running; watchdog soft-skip.",
    }, null, 2));
    return;
  }

  process.env.ARABIC_COLLECT_FORCE = process.env.ARABIC_COLLECT_FORCE || "true";
  const result = await runScheduledJob(JOB_COLLECT_ARABIC, { force: true });
  console.log(JSON.stringify({
    ...base,
    ok: result.ok,
    skipped: result.skipped,
    triggered: true,
    message: result.message,
  }, null, 2));

  if (!result.ok && !result.skipped) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
