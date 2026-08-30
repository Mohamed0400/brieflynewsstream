/**
 * Run one ScheduledJob by key (GitHub Actions / ops hosts).
 *
 * Usage:
 *   npx tsx src/worker/job-once.ts translate --force
 *   npx tsx src/worker/job-once.ts translate --force --skip-if-collect-running
 *   npx tsx src/worker/job-once.ts collect --force
 *
 * Flags:
 *   --force                     Steal the job lock if held
 *   --skip-if-collect-running   For translate: no-op while collect holds a live lock
 */
import { prisma } from "../lib/prisma";
import {
  ensureDefaultJobs,
  isCurrentlyLocked,
  JOB_COLLECT,
  JOB_TRANSLATE,
  runScheduledJob,
} from "../lib/scheduler";

async function main() {
  const argv = process.argv.slice(2);
  const key = argv.find((arg) => !arg.startsWith("--"));
  if (!key) {
    console.error("Usage: job-once.ts <job-key> [--force] [--skip-if-collect-running]");
    process.exitCode = 1;
    return;
  }

  const force = argv.includes("--force");
  const skipIfCollectRunning = argv.includes("--skip-if-collect-running");

  await ensureDefaultJobs();

  if (skipIfCollectRunning && key === JOB_TRANSLATE) {
    const collect = await prisma.scheduledJob.findUnique({
      where: { key: JOB_COLLECT },
      select: { lockedUntil: true, lastStatus: true, lastRunAt: true },
    });
    if (collect && isCurrentlyLocked(collect.lockedUntil, new Date())) {
      const payload = {
        ok: true,
        skipped: true,
        message: `collect is running${collect.lastRunAt ? ` since ${collect.lastRunAt.toISOString()}` : ""}; translate deferred until after collect.`,
      };
      console.log(JSON.stringify(payload, null, 2));
      return;
    }
  }

  const result = await runScheduledJob(key, { force });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok && !result.skipped) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
