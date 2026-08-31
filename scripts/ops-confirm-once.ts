/**
 * Post-collect confirmation for GitHub Actions.
 * Fails hard when the live feed is stale or collect/translate jobs are unhealthy.
 * Translation backlog is repaired aggressively; if the feed is fresh and jobs are
 * healthy, remaining backlog is a self-heal warning (exit 0) so collect stays green.
 *
 * Flags:
 *   --max-age-hours=N          Newest publishedAt must be within N hours (default 8)
 *   --max-pending-translate=N  Soft threshold for incomplete bilingual rows (default 400)
 *   --repair                   On failure: heal + force collect (if needed) + drain translate
 *   --strict-translate         Fail (exit 1) when backlog stays above the soft threshold
 */
import { prisma } from "../src/lib/prisma";
import { limits } from "../src/lib/limits";
import {
  backfillTranslatedAt,
  countIncompleteBilingualArticles,
  drainPendingTranslations,
} from "../src/lib/article-translation";
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

function freshnessCutoff() {
  return new Date(Date.now() - Math.max(1, limits.newsMaxAgeHours) * 3_600_000);
}

async function snapshot() {
  const cutoff = freshnessCutoff();
  await backfillTranslatedAt(cutoff);
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
        publishedAt: { gte: cutoff },
      },
    }),
    countIncompleteBilingualArticles(cutoff),
  ]);
  const ageHours = newest?.publishedAt
    ? (Date.now() - newest.publishedAt.getTime()) / 3_600_000
    : null;
  return { collect, translate, newest, pendingRaw, pendingTranslate, ageHours };
}

function collectHealthy(state: Awaited<ReturnType<typeof snapshot>>) {
  if (!state.collect) return false;
  if (state.collect.lastStatus === "interrupted" || state.collect.lastStatus === "error") return false;
  if (state.collect.lastStatus === "running" && state.collect.lockedUntil && state.collect.lockedUntil > new Date()) {
    return false;
  }
  return true;
}

function translateJobHealthy(state: Awaited<ReturnType<typeof snapshot>>) {
  const status = state.translate?.lastStatus;
  return status !== "interrupted" && status !== "error";
}

async function main() {
  await ensureDefaultJobs();
  const argv = process.argv.slice(2);
  const maxAgeHours = intFlag(argv, "--max-age-hours", 8);
  const maxPendingTranslate = intFlag(argv, "--max-pending-translate", 400);
  const repair = argv.includes("--repair");
  const strictTranslate = argv.includes("--strict-translate");

  let state = await snapshot();
  const hardProblems: string[] = [];
  const softProblems: string[] = [];

  if (!state.collect) {
    hardProblems.push("collect job row missing");
  } else if (state.collect.lastStatus === "interrupted" || state.collect.lastStatus === "error") {
    hardProblems.push(`collect lastStatus=${state.collect.lastStatus}`);
  } else if (state.collect.lastStatus === "running" && state.collect.lockedUntil && state.collect.lockedUntil > new Date()) {
    hardProblems.push("collect still marked running after workflow collect step");
  }

  if (state.translate?.lastStatus === "interrupted" || state.translate?.lastStatus === "error") {
    hardProblems.push(`translate lastStatus=${state.translate.lastStatus}`);
  }

  if (state.ageHours == null) {
    hardProblems.push("no articles in database");
  } else if (state.ageHours > maxAgeHours) {
    hardProblems.push(`newest publishedAt is ${state.ageHours.toFixed(1)}h old (max ${maxAgeHours}h)`);
  }

  if (state.pendingTranslate > maxPendingTranslate) {
    softProblems.push(
      `${state.pendingTranslate} fresh articles still need translation (max ${maxPendingTranslate})`,
    );
  }

  const report = {
    at: new Date().toISOString(),
    maxAgeHours,
    maxPendingTranslate,
    ok: hardProblems.length === 0 && (strictTranslate ? softProblems.length === 0 : true),
    selfHealing: false,
    problems: [...hardProblems, ...(strictTranslate ? softProblems : [])],
    warnings: softProblems,
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

  if ((hardProblems.length || softProblems.length) && repair) {
    await clearStaleJobLocks();
    await releaseAllRunningJobLocks();
    const heal = await runOpsAutoHeal({
      forceEnabled: true,
      forceLocks: true,
      translate: false,
      triggerCollectIfStale: false,
      actorId: "system:gha-confirm",
    });
    const needsCollect = hardProblems.some((p) => p.startsWith("collect ") || p.includes("publishedAt") || p.includes("no articles"));
    const collect = needsCollect
      ? await runScheduledJob(JOB_COLLECT, { force: true })
      : { ok: true, skipped: true, message: "collect repair skipped (translate-only issue)" };

    let translateMessage = "translate repair skipped";
    let drained = 0;
    let pendingAfter = state.pendingTranslate;
    let apiError: string | null = null;
    if (softProblems.length || hardProblems.some((p) => p.includes("translate "))) {
      const repairPasses = Math.max(limits.translateMaxPasses, 40);
      for (let round = 0; round < 8 && pendingAfter > maxPendingTranslate; round += 1) {
        await backfillTranslatedAt(freshnessCutoff());
        const result = await drainPendingTranslations(repairPasses);
        drained += result.translated;
        pendingAfter = await countIncompleteBilingualArticles(freshnessCutoff());
        apiError = result.apiError || apiError;
        if (result.translated === 0) break;
      }
      // Keep draining via the scheduled job path so job status stays fresh.
      if (pendingAfter > 0 && !apiError) {
        const translateJob = await runScheduledJob(JOB_TRANSLATE, { force: true });
        translateMessage = `${drained} translated in repair drain; job: ${translateJob.message}`;
        pendingAfter = await countIncompleteBilingualArticles(freshnessCutoff());
      } else if (apiError) {
        translateMessage = `${drained} translated in repair; API blocked further drain: ${apiError}`;
      } else {
        translateMessage = `${drained} translated in repair; backlog cleared`;
      }
    } else {
      const translate = await runScheduledJob(JOB_TRANSLATE, { force: true });
      translateMessage = translate.message;
      pendingAfter = await countIncompleteBilingualArticles(freshnessCutoff());
    }

    state = await snapshot();
    const softRemaining = state.pendingTranslate > maxPendingTranslate;
    const hardRemaining =
      !collect.ok
      || !collectHealthy(state)
      || !translateJobHealthy(state)
      || state.ageHours == null
      || state.ageHours > maxAgeHours;

    report.repair = {
      heal: heal.messages,
      collect: collect.message,
      translate: translateMessage,
      drained,
      apiError,
      ok: !hardRemaining && (!strictTranslate || !softRemaining),
      ageHoursAfter: state.ageHours,
      pendingTranslateAfter: state.pendingTranslate,
      collectStatusAfter: state.collect?.lastStatus ?? null,
      translateStatusAfter: state.translate?.lastStatus ?? null,
    };
    report.pendingTranslate = state.pendingTranslate;
    report.ageHours = state.ageHours;
    report.newestPublishedAt = state.newest?.publishedAt?.toISOString() ?? null;
    report.newestTitle = state.newest?.title ?? null;
    report.warnings = [
      ...(softRemaining
        ? [`${state.pendingTranslate} fresh articles still need translation (max ${maxPendingTranslate}); scheduled translate will continue`]
        : []),
      ...(apiError ? [`translation API: ${apiError}`] : []),
    ];
    report.selfHealing = !hardRemaining && softRemaining && !strictTranslate;
    report.ok = !hardRemaining && (!strictTranslate || !softRemaining);
    report.problems = hardRemaining
      ? [...hardProblems, "repair did not fully restore a fresh bilingual feed"]
      : (strictTranslate && softRemaining ? report.warnings : []);
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
