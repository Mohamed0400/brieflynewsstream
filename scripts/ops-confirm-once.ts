/**
 * Post-collect confirmation for GitHub Actions.
 * Fails (and optionally re-heals + re-collects) when the live feed is still stale
 * or collect ended interrupted/error.
 *
 * Flags:
 *   --max-age-hours=N   Newest publishedAt must be within N hours (default 8)
 *   --repair            On failure: force-locks heal then force collect once
 */
import { prisma } from "../src/lib/prisma";
import { limits } from "../src/lib/limits";
import { runOpsAutoHeal } from "../src/lib/ops-recovery";
import {
  clearStaleJobLocks,
  ensureDefaultJobs,
  JOB_COLLECT,
  releaseAllRunningJobLocks,
  runScheduledJob,
} from "../src/lib/scheduler";

function maxAgeHoursFromArgv(argv: string[]) {
  const flag = argv.find((arg) => arg.startsWith("--max-age-hours="));
  if (!flag) return 8;
  const value = Number(flag.slice("--max-age-hours=".length));
  return Number.isFinite(value) && value > 0 ? value : 8;
}

async function snapshot() {
  const [collect, newest, pendingRaw] = await Promise.all([
    prisma.scheduledJob.findUnique({
      where: { key: JOB_COLLECT },
      select: { lastStatus: true, lastRunAt: true, lastError: true, lastSummary: true, lockedUntil: true },
    }),
    prisma.article.findFirst({
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true, createdAt: true, title: true },
    }),
    prisma.rawArticle.count({
      where: {
        processedAt: null,
        publishedAt: {
          gte: new Date(Date.now() - Math.max(1, limits.newsMaxAgeHours) * 3_600_000),
        },
      },
    }),
  ]);
  const ageHours = newest?.publishedAt
    ? (Date.now() - newest.publishedAt.getTime()) / 3_600_000
    : null;
  return { collect, newest, pendingRaw, ageHours };
}

async function main() {
  await ensureDefaultJobs();
  const argv = process.argv.slice(2);
  const maxAgeHours = maxAgeHoursFromArgv(argv);
  const repair = argv.includes("--repair");

  let state = await snapshot();
  const problems: string[] = [];

  if (!state.collect) {
    problems.push("collect job row missing");
  } else if (state.collect.lastStatus === "interrupted" || state.collect.lastStatus === "error") {
    problems.push(`collect lastStatus=${state.collect.lastStatus}`);
  } else if (state.collect.lastStatus === "running" && state.collect.lockedUntil && state.collect.lockedUntil > new Date()) {
    // Still running after the collect job finished is unexpected for confirm — treat as stuck.
    problems.push("collect still marked running after workflow collect step");
  }

  if (state.ageHours == null) {
    problems.push("no articles in database");
  } else if (state.ageHours > maxAgeHours) {
    problems.push(`newest publishedAt is ${state.ageHours.toFixed(1)}h old (max ${maxAgeHours}h)`);
  }

  const report = {
    at: new Date().toISOString(),
    maxAgeHours,
    ok: problems.length === 0,
    problems,
    ageHours: state.ageHours,
    newestPublishedAt: state.newest?.publishedAt?.toISOString() ?? null,
    newestTitle: state.newest?.title ?? null,
    pendingFreshRaw: state.pendingRaw,
    collect: state.collect
      ? {
          lastStatus: state.collect.lastStatus,
          lastRunAt: state.collect.lastRunAt?.toISOString() ?? null,
          lastError: state.collect.lastError,
          lastSummary: state.collect.lastSummary,
        }
      : null,
    repair: null as null | Record<string, unknown>,
  };

  if (problems.length && repair) {
    await clearStaleJobLocks();
    await releaseAllRunningJobLocks();
    const heal = await runOpsAutoHeal({
      forceEnabled: true,
      forceLocks: true,
      translate: true,
      triggerCollectIfStale: false,
      actorId: "system:gha-confirm",
    });
    const collect = await runScheduledJob(JOB_COLLECT, { force: true });
    state = await snapshot();
    report.repair = {
      heal: heal.messages,
      collect: collect.message,
      ok: collect.ok,
      skipped: collect.skipped,
      ageHoursAfter: state.ageHours,
      collectStatusAfter: state.collect?.lastStatus ?? null,
    };
    const stillBad =
      !collect.ok
      || state.ageHours == null
      || state.ageHours > maxAgeHours
      || state.collect?.lastStatus === "interrupted"
      || state.collect?.lastStatus === "error";
    report.ok = !stillBad;
    if (stillBad) {
      report.problems = [
        ...problems,
        "repair collect did not restore a fresh feed",
      ];
    } else {
      report.problems = [];
    }
  }

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
