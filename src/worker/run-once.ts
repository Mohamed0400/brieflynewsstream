import { prisma } from "../lib/prisma";
import {
  clearStaleJobLocks,
  ensureDefaultJobs,
  JOB_COLLECT,
  releaseJobLock,
  runScheduledJob,
} from "../lib/scheduler";

const collectOnly = process.argv.includes("--collect-only");

function registerInterruptHandlers() {
  const onSignal = () => {
    void releaseJobLock(JOB_COLLECT).finally(() => process.exit(143));
  };
  process.once("SIGTERM", onSignal);
  process.once("SIGINT", onSignal);
}

if (collectOnly) {
  process.env.CRON_COLLECT_ONLY = "true";
}

registerInterruptHandlers();

ensureDefaultJobs()
  .then(() => clearStaleJobLocks())
  .then(() => runScheduledJob(JOB_COLLECT))
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok && !result.skipped) process.exitCode = 1;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
