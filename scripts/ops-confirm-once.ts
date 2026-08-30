/**
 * Post-collect confirmation for GitHub Actions.
 * Fails (and optionally repairs) when the live feed is still stale, collect
 * ended badly, or a large translation backlog remains.
 *
 * Flags:
 *   --max-age-hours=N          Newest publishedAt must be within N hours (default 8)
 *   --max-pending-translate=N  Fresh articles missing translation (default 150)
 *   --repair                   On failure: heal + force collect + force translate
 */
import { prisma } from "../src/lib/prisma";
import { limits } from "../src/lib/limits";
import { runOpsAutoHeal } from "../src/lib/ops-recovery";
import {
  clearStaleJobLocks,
  ensureDefaultJobs,
  JOB_COLLECT,
  JOB_TRANSLATE,
  releaseAllRunningJobLocks,
  runScheduledJob,
} from "../src/lib/scheduler";

function intFlag(argv: string[], name: string, fallback: number) {
  const flag = argv.find((arg) => arg.startsWith(`${name}=`));
  if (!flag) return fallback;
  const value = Number(flag.slice(name.length + 1));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function snapshot() {
  const freshnessCutoff = new Date(
    Date.now() - Math.max(1, limits.newsMaxAgeHours) * 3_600_000,
  );
  const [collect, translate, newest, pendingRaw, pendingTranslate] = await Promise.all([
    prisma.scheduledJob.findUnique({
      where: { key: JOB_COLLECT },
      select: { lastStatus: true, lastRunAt: true, lastError: true, lastSummary: true, lockedUntil: true },
    }),
    prisma.scheduledJob.findUnique({
      where: { key: JOB_TRANSLATE },
      select: { lastStatus: true, lastRunAt: true, lastError: true, lastSummary: true, lockedUntil: true },
    }),
    prisma.article.findFirst({
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true, createdAt: true, title: true },
    }),
    prisma.rawArticle.count({
      where: {
        processedAt: null,
        publishedAt: { gte: freshnessCutoff },
      },
    }),
    prisma.article.count({
      where: {
        publishedAt: { gte: freshnessCutoff },
        OR: [
          { translatedAt: null },
          { titleAr: null },
          { summaryAr: null },
          { titleEn: null },
          { summaryEn: null },
        ],
      },
    }),
  ]);
  const ageHours = newest?.publishedAt
    ? (Date.now() - newest.publishedAt.getTime()) / 3_600_000
    : null;
  return { collect, translate, newest, pendingRaw, pendingTranslate, ageHours };
}

async function main() {
  await ensureDefaultJobs();
  const argv = process.argv.slice(2);
  const maxAgeHours = intFlag(argv, "--max-age-hours", 8);
  const maxPendingTranslate = intFlag(argv, "--max-pending-translate", 150);
  const repair = argv.includes("--repair");

  let state = await snapshot();
  const problems: string[] = [];

  if (!state.collect) {
    problems.push("collect job row missing");
  } else if (state.collect.lastStatus === "interrupted" || state.collect.lastStatus === "error") {
    problems.push(`collect lastStatus=${state.collect.lastStatus}`);
  } else if (state.collect.lastStatus === "running" && state.collect.lockedUntil && state.collect.lockedUntil > new Date()) {
    problems.push("collect still marked running after workflow collect step");
  }

  if (state.translate?.lastStatus === "interrupted" || state.translate?.lastStatus === "error") {
    problems.push(`translate lastStatus=${state.translate.lastStatus}`);
  }

  if (state.ageHours == null) {
    problems.push("no articles in database");
  } else if (state.ageHours > maxAgeHours) {
    problems.push(`newest publishedAt is ${state.ageHours.toFixed(1)}h old (max ${maxAgeHours}h)`);
  }

  if (state.pendingTranslate > maxPendingTranslate) {
    problems.push(
      `${state.pendingTranslate} fresh articles still need translation (max ${maxPendingTranslate})`,
    );
  }

  const report = {
    at: new Date().toISOString(),
    maxAgeHours,
    maxPendingTranslate,
    ok: problems.length === 0,
    problems,
    ageHours: state.ageHours,
    newestPublishedAt: state.newest?.publishedAt?.toISOString() ?? null,
    newestTitle: state.newest?.title ?? null,
    pendingFreshRaw: state.pendingRaw,
    pendingTranslate: state.pendingTranslate,
    collect: state.collect
      ? {
          lastStatus: state.collect.lastStatus,
          lastRunAt: state.collect.lastRunAt?.toISOString() ?? null,
          lastError: state.collect.lastError,
          lastSummary: state.collect.lastSummary,
        }
      : null,
    translate: state.translate
      ? {
          lastStatus: state.translate.lastStatus,
          lastRunAt: state.translate.lastRunAt?.toISOString() ?? null,
          lastError: state.translate.lastError,
          lastSummary: state.translate.lastSummary,
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
      translate: false,
      triggerCollectIfStale: false,
      actorId: "system:gha-confirm",
    });
    const needsCollect = problems.some((p) => p.startsWith("collect ") || p.includes("publishedAt") || p.includes("no articles"));
    const collect = needsCollect
      ? await runScheduledJob(JOB_COLLECT, { force: true })
      : { ok: true, skipped: true, message: "collect repair skipped (translate-only issue)" };
    const translate = await runScheduledJob(JOB_TRANSLATE, { force: true });
    state = await snapshot();
    report.repair = {
      heal: heal.messages,
      collect: collect.message,
      translate: translate.message,
      ok: collect.ok && translate.ok,
      ageHoursAfter: state.ageHours,
      pendingTranslateAfter: state.pendingTranslate,
      collectStatusAfter: state.collect?.lastStatus ?? null,
      translateStatusAfter: state.translate?.lastStatus ?? null,
    };
    const stillBad =
      !collect.ok
      || !translate.ok
      || state.ageHours == null
      || state.ageHours > maxAgeHours
      || state.pendingTranslate > maxPendingTranslate
      || state.collect?.lastStatus === "interrupted"
      || state.collect?.lastStatus === "error"
      || state.translate?.lastStatus === "interrupted"
      || state.translate?.lastStatus === "error";
    report.ok = !stillBad;
    report.problems = stillBad
      ? [...problems, "repair did not fully restore a fresh bilingual feed"]
      : [];
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
