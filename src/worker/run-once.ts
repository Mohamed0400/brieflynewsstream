import { prisma } from "../lib/prisma";
import { ensureDefaultJobs, JOB_COLLECT, runScheduledJob } from "../lib/scheduler";

ensureDefaultJobs()
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
