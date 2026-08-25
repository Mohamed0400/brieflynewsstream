import { prisma } from "../lib/prisma";
import {
  clearStaleJobLocks,
  ensureDefaultJobs,
  JOB_COLLECT,
  releaseJobLock,
  runScheduledJob,
  shouldRunStaleCollect,
  STALE_COLLECT_MAX_AGE_MS,
} from "../lib/scheduler";

const collectOnly = process.argv.includes("--collect-only");
const ifStale = process.argv.includes("--if-stale");

function registerInterruptHandlers() {
  const onSignal = () => {
    void releaseJobLock(JOB_COLLECT).finally(() => process.exit(143));
  };
  process.once("SIGTERM", onSignal);
  process.once("SIGINT", onSignal);
}

async function shouldSkipFreshCollect() {
  if (!ifStale) return false;
  const job = await prisma.scheduledJob.findUnique({
    where: { key: JOB_COLLECT },
    select: { lastStatus: true, lastRunAt: true, lockedUntil: true },
  });
  if (!job) return false;
  return !shouldRunStaleCollect(job, new Date(), STALE_COLLECT_MAX_AGE_MS);
}

if (collectOnly) {
  process.env.CRON_COLLECT_ONLY = "true";
}

registerInterruptHandlers();

ensureDefaultJobs()
  .then(() => shouldSkipFreshCollect())
  .then((skipFresh) => {
    if (skipFresh) {
      console.log(JSON.stringify({
        ok: true,
        skipped: true,
        message: "Collect is fresh or already running; --if-stale no-op.",
      }, null, 2));
      return;
    }
    return clearStaleJobLocks()
      .then(() => runScheduledJob(JOB_COLLECT))
      .then((result) => {
        console.log(JSON.stringify(result, null, 2));
        if (!result.ok && !result.skipped) process.exitCode = 1;
      });
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
