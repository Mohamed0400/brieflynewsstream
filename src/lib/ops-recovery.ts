import type { BilingualCoverage } from "./article-translation";
import { drainPendingTranslations, getBilingualCoverage } from "./article-translation";
import { kuwaitDate } from "./market";
import { limits } from "./limits";
import {
  countPendingRawArticles,
  drainRawBacklog,
  type PipelineResult,
} from "./pipeline";
import { prisma } from "./prisma";
import {
  clearStaleJobLocks,
  ensureDefaultJobs,
  getScheduleSnapshot,
  JOB_COLLECT,
  releaseJobLock,
  runScheduledJob,
  shouldClearStaleLock,
} from "./scheduler";

export type OpsJobStatus = {
  key: string;
  name: string;
  running: boolean;
  stale: boolean;
  lastStatus: string | null;
  lastRunAt: string | null;
  lastError: string | null;
  lastSummary: string | null;
};

export type OpsStatusSnapshot = {
  at: string;
  jobs: OpsJobStatus[];
  stuckJobs: string[];
  pendingRawArticles: number;
  pendingTranslationArticles: number;
  bilingual: {
    today: BilingualCoverage;
    fresh: BilingualCoverage;
  };
  scheduler: {
    online: boolean;
    processName: string | null;
    lastTickAt: string | null;
  };
  notes: string[];
};

export type OpsRecoverOptions = {
  forceLocks?: boolean;
  normalize?: boolean;
  translate?: boolean;
  collect?: boolean;
};

export type OpsRecoverResult = {
  at: string;
  clearedStaleLocks: string[];
  releasedRunningJobs: string[];
  rawBefore: number | null;
  rawAfter: number | null;
  rawNormalized: number | null;
  normalizePasses: number | null;
  translated: number | null;
  translationPending: number | null;
  collect: { ok: boolean; skipped: boolean; message: string } | null;
  messages: string[];
  remaining: {
    pendingRawArticles: number;
    pendingTranslationArticles: number;
    stuckJobs: string[];
  };
};

export type ReleaseLocksOptions = {
  keys?: string[];
  force?: boolean;
};

function emptyPipelineResult(): PipelineResult {
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

function freshnessCutoff() {
  return new Date(Date.now() - Math.max(1, limits.newsMaxAgeHours) * 60 * 60 * 1000);
}

function todayCutoff() {
  return new Date(`${kuwaitDate()}T00:00:00+03:00`);
}

export function mapOpsJobStatuses(
  jobs: Array<{
    key: string;
    name: string;
    running: boolean;
    lastStatus: string | null;
    lastRunAt: string | null;
    lastError: string | null;
    lastSummary: string | null;
    lockedUntil?: Date | null;
    lastRunAtDate?: Date | null;
    lastStatusRaw?: string | null;
  }>,
  now: Date,
): OpsJobStatus[] {
  return jobs.map((job) => {
    const stale = job.running && shouldClearStaleLock({
      key: job.key,
      lastStatus: job.lastStatusRaw ?? (job.running ? "running" : job.lastStatus),
      lockedUntil: job.lockedUntil ?? null,
      lastRunAt: job.lastRunAtDate ?? (job.lastRunAt ? new Date(job.lastRunAt) : null),
    }, now);
    return {
      key: job.key,
      name: job.name,
      running: job.running,
      stale,
      lastStatus: job.lastStatus,
      lastRunAt: job.lastRunAt,
      lastError: job.lastError,
      lastSummary: job.lastSummary,
    };
  });
}

export function resolveRecoverPlan(options: OpsRecoverOptions) {
  const explicit = options.forceLocks || options.normalize || options.translate || options.collect;
  return {
    forceLocks: options.forceLocks === true || !explicit,
    normalize: options.normalize === true || !explicit,
    translate: options.translate === true || !explicit,
    collect: options.collect === true,
  };
}

export function summarizeRecoverResult(result: Omit<OpsRecoverResult, "at" | "remaining">): string[] {
  const messages: string[] = [];
  if (result.clearedStaleLocks.length) {
    messages.push(`Cleared ${result.clearedStaleLocks.length} stale lock(s): ${result.clearedStaleLocks.join(", ")}.`);
  }
  if (result.releasedRunningJobs.length) {
    messages.push(`Released ${result.releasedRunningJobs.length} running job lock(s): ${result.releasedRunningJobs.join(", ")}.`);
  }
  if (result.rawNormalized != null && result.rawNormalized > 0) {
    messages.push(`Normalized ${result.rawNormalized} raw article(s) (${result.rawBefore ?? 0} → ${result.rawAfter ?? 0} pending).`);
  } else if (result.rawBefore === 0) {
    messages.push("No raw normalize backlog.");
  } else if (result.rawAfter != null && result.rawAfter > 0) {
    messages.push(`${result.rawAfter} raw article(s) still pending normalization.`);
  }
  if (result.translated != null && result.translated > 0) {
    messages.push(`Translated ${result.translated} article(s); ${result.translationPending ?? 0} still pending.`);
  } else if (result.translationPending === 0) {
    messages.push("Translation backlog is clear.");
  } else if (result.translationPending != null) {
    messages.push(`${result.translationPending} article(s) still pending translation.`);
  }
  if (result.collect) {
    messages.push(result.collect.message);
  }
  if (!messages.length) messages.push("No recovery actions changed pipeline state.");
  return messages;
}

async function countPendingTranslationArticles(cutoff: Date) {
  return prisma.article.count({
    where: {
      publishedAt: { gte: cutoff },
      translatedAt: null,
    },
  });
}

export async function getOpsStatus(): Promise<OpsStatusSnapshot> {
  await ensureDefaultJobs();
  const now = new Date();
  const fresh = freshnessCutoff();
  const [rawJobs, pendingRaw, pendingTranslation, bilingualToday, bilingualFresh, snapshot] = await Promise.all([
    prisma.scheduledJob.findMany({
      orderBy: { name: "asc" },
      select: {
        key: true,
        name: true,
        lastRunAt: true,
        lastStatus: true,
        lastError: true,
        lastSummary: true,
        lockedUntil: true,
      },
    }),
    countPendingRawArticles(),
    countPendingTranslationArticles(fresh),
    getBilingualCoverage(todayCutoff()),
    getBilingualCoverage(fresh),
    getScheduleSnapshot(),
  ]);

  const jobs = mapOpsJobStatuses(rawJobs.map((job) => {
    const running = Boolean(job.lockedUntil && job.lockedUntil > now);
    return {
      key: job.key,
      name: job.name,
      running,
      lastStatus: running ? "running" : job.lastStatus,
      lastRunAt: job.lastRunAt?.toISOString() ?? null,
      lastError: job.lastError,
      lastSummary: job.lastSummary,
      lockedUntil: job.lockedUntil,
      lastRunAtDate: job.lastRunAt,
      lastStatusRaw: job.lastStatus,
    };
  }), now);
  const stuckJobs = jobs.filter((job) => job.running).map((job) => job.key);

  return {
    at: now.toISOString(),
    jobs,
    stuckJobs,
    pendingRawArticles: pendingRaw,
    pendingTranslationArticles: pendingTranslation,
    bilingual: {
      today: bilingualToday,
      fresh: bilingualFresh,
    },
    scheduler: snapshot.scheduler,
    notes: [
      "Normalize and translate drains are bounded on Vercel (maxDuration 300s). Use GitHub Actions for full collect.",
    ],
  };
}

export async function releaseStuckJobLocks(options: ReleaseLocksOptions = {}) {
  await ensureDefaultJobs();
  const now = new Date();
  const running = await prisma.scheduledJob.findMany({
    where: { lastStatus: "running" },
    select: { key: true, lastStatus: true, lockedUntil: true, lastRunAt: true },
    orderBy: { key: "asc" },
  });
  const targets = options.keys?.length
    ? running.filter((job) => options.keys!.includes(job.key))
    : running;
  const released: string[] = [];
  for (const job of targets) {
    if (options.force || shouldClearStaleLock(job, now)) {
      await releaseJobLock(job.key);
      released.push(job.key);
    }
  }
  return released;
}

export async function runOpsRecovery(options: OpsRecoverOptions = {}): Promise<OpsRecoverResult> {
  await ensureDefaultJobs();
  const plan = resolveRecoverPlan(options);
  const now = new Date();
  const fresh = freshnessCutoff();

  const clearedStaleLocks = await clearStaleJobLocks();
  const releasedRunningJobs: string[] = [];
  if (plan.forceLocks) {
    const running = await prisma.scheduledJob.findMany({
      where: { lastStatus: "running" },
      select: { key: true, lastStatus: true, lockedUntil: true, lastRunAt: true },
    });
    for (const job of running) {
      if (shouldClearStaleLock(job, now) || plan.forceLocks) {
        await releaseJobLock(job.key);
        releasedRunningJobs.push(job.key);
      }
    }
  }

  let rawBefore: number | null = null;
  let rawAfter: number | null = null;
  let rawNormalized: number | null = null;
  let normalizePasses: number | null = null;
  if (plan.normalize) {
    rawBefore = await countPendingRawArticles();
    if (rawBefore > 0) {
      const normalizeResult = await drainRawBacklog(emptyPipelineResult(), {
        maxPasses: limits.normalizeBacklogPasses,
      });
      rawAfter = normalizeResult.pending;
      rawNormalized = normalizeResult.normalized;
      normalizePasses = normalizeResult.passes;
    } else {
      rawAfter = 0;
      rawNormalized = 0;
      normalizePasses = 0;
    }
  }

  let translated: number | null = null;
  let translationPending: number | null = null;
  if (plan.translate) {
    const translation = await drainPendingTranslations(limits.translateMaxPasses);
    translated = translation.translated;
    translationPending = translation.pending;
  }

  let collect: OpsRecoverResult["collect"] = null;
  if (plan.collect) {
    const result = await runScheduledJob(JOB_COLLECT, { force: true });
    collect = {
      ok: result.ok,
      skipped: result.skipped,
      message: result.message,
    };
  }

  const remaining = {
    pendingRawArticles: await countPendingRawArticles(),
    pendingTranslationArticles: await countPendingTranslationArticles(fresh),
    stuckJobs: (await getOpsStatus()).stuckJobs,
  };

  const partial: Omit<OpsRecoverResult, "at" | "remaining"> = {
    clearedStaleLocks,
    releasedRunningJobs,
    rawBefore,
    rawAfter,
    rawNormalized,
    normalizePasses,
    translated,
    translationPending,
    collect,
    messages: [],
  };
  partial.messages = summarizeRecoverResult(partial);

  return {
    at: now.toISOString(),
    ...partial,
    remaining,
  };
}
