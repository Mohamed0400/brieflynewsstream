import { prisma } from "../lib/prisma";
import {
  clearStaleJobLocks,
  ensureDefaultJobs,
  JOB_COLLECT_ARABIC,
  runScheduledJob,
} from "../lib/scheduler";
import { isArabicCollectEnabled } from "../lib/arabic-country-sources";

const force = process.argv.includes("--force");

function registerInterruptHandlers() {
  const onSignal = () => {
    void prisma.scheduledJob.updateMany({
      where: { key: JOB_COLLECT_ARABIC, lastStatus: "running" },
      data: {
        lockedUntil: null,
        lastStatus: "interrupted",
        lastError: "Arabic collect worker received interrupt signal.",
      },
    }).finally(() => process.exit(143));
  };
  process.once("SIGTERM", onSignal);
  process.once("SIGINT", onSignal);
}

if (force) {
  process.env.ARABIC_COLLECT_FORCE = "true";
}

registerInterruptHandlers();

ensureDefaultJobs()
  .then(async () => {
    if (!isArabicCollectEnabled()) {
      console.log(JSON.stringify({
        ok: true,
        skipped: true,
        message: "Arabic collect disabled. Set ARABIC_COLLECT_ENABLED=true or pass --force with ARABIC_COLLECT_FORCE.",
      }, null, 2));
      return;
    }
    await clearStaleJobLocks();
    const result = await runScheduledJob(JOB_COLLECT_ARABIC, { force });
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok && !result.skipped) process.exitCode = 1;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
