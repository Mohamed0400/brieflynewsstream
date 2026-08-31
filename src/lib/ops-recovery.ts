import type { BilingualCoverage } from "./article-translation";
import { logAdminAction } from "./admin-audit";
import { purgeLowQualityArticles } from "./article-quality";
import { drainPendingTranslations, getBilingualCoverage } from "./article-translation";
import { kuwaitDate } from "./market";
import { limits } from "./limits";
import { getOpsSettings } from "./ops-settings";
import {
  abandonStaleRawArticles,
  countFreshPendingRawArticles,
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
  releaseAllRunningJobLocks,
  releaseJobLock,
  runScheduledJob,
  shouldClearStaleLock,
  shouldRunStaleCollect,
} from "./scheduler";

/** Audit actor for automated pipeline heal (no human session). */
export const OPS_SYSTEM_ACTOR_ID = "system:ops-heal";

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
  pendingFreshRawArticles: number;
  pendingStaleRawArticles: number;
  pendingTranslationArticles: number;
  newestPublishedAt: string | null;
  newestPublishedAgeHours: number | null;
  pipelineAutoHeal: boolean;
  pipelineAutoHealCollect: boolean;
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
  purgeQuality?: boolean;
};

export type OpsRecoverResult = {
  at: string;
  clearedStaleLocks: string[];
  releasedRunningJobs: string[];
  abandonedRaw: number | null;
  rawBefore: number | null;
  rawAfter: number | null;
  rawNormalized: number | null;
  normalizePasses: number | null;
  translated: number | null;
  translationPending: number | null;
  collect: { ok: boolean; skipped: boolean; message: string } | null;
  qualityPurged: number | null;
  qualityScanned: number | null;
  messages: string[];
  remaining: {
    pendingRawArticles: number;
    pendingTranslationArticles: number;
    stuckJobs: string[];
  };
};

export type OpsAutoHealResult = {
  at: string;
  disabled: boolean;
  clearedStaleLocks: string[];
  abandonedRaw: number;
  translated: number | null;
  translationPending: number | null;
  collect: { ok: boolean; skipped: boolean; message: string } | null;
  messages: string[];
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
    rejections: { stale: 0, notAccepted: 0, blocked: 0, lowQuality: 0 },
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
  const explicit = options.forceLocks || options.normalize || options.translate || options.collect || options.purgeQuality;
  return {
    forceLocks: options.forceLocks === true || !explicit,
    normalize: options.normalize === true || !explicit,
    translate: options.translate === true || !explicit,
    collect: options.collect === true,
    purgeQuality: options.purgeQuality === true,
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
  if (result.abandonedRaw != null && result.abandonedRaw > 0) {
    messages.push(`Abandoned ${result.abandonedRaw} stale raw article(s) outside the live window.`);
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
  if (result.qualityPurged != null && result.qualityPurged > 0) {
    messages.push(`Purged ${result.qualityPurged} low-quality article(s) after scanning ${result.qualityScanned ?? 0}.`);
  } else if (result.qualityScanned != null && result.qualityScanned > 0) {
    messages.push(`Scanned ${result.qualityScanned} article(s); none matched the low-quality purge rules.`);
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
  const [
    rawJobs,
    pendingRaw,
    pendingFreshRaw,
    pendingTranslation,
    bilingualToday,
    bilingualFresh,
    snapshot,
    newest,
    settings,
  ] = await Promise.all([
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
    countFreshPendingRawArticles(),
    countPendingTranslationArticles(fresh),
    getBilingualCoverage(todayCutoff()),
    getBilingualCoverage(fresh),
    getScheduleSnapshot(),
    prisma.article.findFirst({
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true },
    }),
    getOpsSettings(),
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
  const stuckJobs = jobs.filter((job) => job.stale).map((job) => job.key);
  const newestPublishedAt = newest?.publishedAt?.toISOString() ?? null;
  const newestPublishedAgeHours = newest?.publishedAt
    ? Math.max(0, (now.getTime() - newest.publishedAt.getTime()) / 3_600_000)
    : null;

  return {
    at: now.toISOString(),
    jobs,
    stuckJobs,
    pendingRawArticles: pendingRaw,
    pendingFreshRawArticles: pendingFreshRaw,
    pendingStaleRawArticles: Math.max(0, pendingRaw - pendingFreshRaw),
    pendingTranslationArticles: pendingTranslation,
    newestPublishedAt,
    newestPublishedAgeHours,
    pipelineAutoHeal: settings.pipelineAutoHeal,
    pipelineAutoHealCollect: settings.pipelineAutoHealCollect,
    bilingual: {
      today: bilingualToday,
      fresh: bilingualFresh,
    },
    scheduler: snapshot.scheduler,
    notes: [
      "Auto-heal clears zombie locks and abandons stale raw on a schedule so collect cannot stay stuck.",
      "Normalize and translate drains are bounded on Vercel (maxDuration 300s). Use GitHub Actions for full collect.",
    ],
  };
}

export async function releaseStuckJobLocks(options: ReleaseLocksOptions = {}) {
  await ensureDefaultJobs();
  if (options.force && !options.keys?.length) {
    return releaseAllRunningJobLocks();
  }
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

export type OpsRecommendation = {
  id: string;
  severity: "critical" | "warning" | "info";
  action: "kill_zombie" | "collect" | "translate" | "recovery" | "auto_heal" | "none";
};

export async function getOpsRecommendations(): Promise<{
  recommendations: OpsRecommendation[];
  pipeline: {
    stuckJobs: string[];
    runningJobs: string[];
    pendingTranslationArticles: number;
    pendingRawArticles: number;
    pendingFreshRawArticles: number;
    pendingStaleRawArticles: number;
    bilingualFreshOk: boolean;
    bilingualFreshMissingArabic: number;
    newestPublishedAt: string | null;
    newestPublishedAgeHours: number | null;
    collectLastStatus: string | null;
    collectLastRunAt: string | null;
    pipelineAutoHeal: boolean;
    pipelineAutoHealCollect: boolean;
  };
}> {
  const status = await getOpsStatus();
  const collect = status.jobs.find((job) => job.key === JOB_COLLECT);
  const ageMs = status.newestPublishedAgeHours != null
    ? status.newestPublishedAgeHours * 3_600_000
    : null;
  const recommendations: OpsRecommendation[] = [];

  if (status.stuckJobs.length) {
    recommendations.push({
      id: "zombie_locks",
      severity: "critical",
      action: "kill_zombie",
    });
  }
  if (status.pendingStaleRawArticles > 0) {
    recommendations.push({
      id: "stale_raw_backlog",
      severity: "critical",
      action: "auto_heal",
    });
  }
  if (collect?.lastStatus === "interrupted" || collect?.lastStatus === "error") {
    recommendations.push({
      id: "collect_failed",
      severity: "critical",
      action: "collect",
    });
  } else if (ageMs != null && ageMs > 6 * 60 * 60 * 1000) {
    recommendations.push({
      id: "stale_feed",
      severity: "warning",
      action: "collect",
    });
  }
  if (status.pendingTranslationArticles > 50 || status.bilingual.fresh.missingArabic > 100) {
    recommendations.push({
      id: "translation_backlog",
      severity: "warning",
      action: "translate",
    });
  }
  if (status.pendingFreshRawArticles > 0) {
    recommendations.push({
      id: "raw_backlog",
      severity: "warning",
      action: "recovery",
    });
  }
  if (!status.pipelineAutoHeal) {
    recommendations.push({
      id: "auto_heal_off",
      severity: "warning",
      action: "none",
    });
  }
  if (!recommendations.length) {
    recommendations.push({
      id: "healthy",
      severity: "info",
      action: "none",
    });
  }

  return {
    recommendations,
    pipeline: {
      stuckJobs: status.stuckJobs,
      runningJobs: status.jobs.filter((job) => job.running).map((job) => job.key),
      pendingTranslationArticles: status.pendingTranslationArticles,
      pendingRawArticles: status.pendingRawArticles,
      pendingFreshRawArticles: status.pendingFreshRawArticles,
      pendingStaleRawArticles: status.pendingStaleRawArticles,
      bilingualFreshOk: status.bilingual.fresh.ok,
      bilingualFreshMissingArabic: status.bilingual.fresh.missingArabic,
      newestPublishedAt: status.newestPublishedAt,
      newestPublishedAgeHours: status.newestPublishedAgeHours,
      collectLastStatus: collect?.lastStatus ?? null,
      collectLastRunAt: collect?.lastRunAt ?? null,
      pipelineAutoHeal: status.pipelineAutoHeal,
      pipelineAutoHealCollect: status.pipelineAutoHealCollect,
    },
  };
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

  let abandonedRaw: number | null = null;
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
      abandonedRaw = normalizeResult.abandoned;
      rawAfter = normalizeResult.pending;
      rawNormalized = normalizeResult.normalized;
      normalizePasses = normalizeResult.passes;
    } else {
      abandonedRaw = await abandonStaleRawArticles();
      rawAfter = 0;
      rawNormalized = 0;
      normalizePasses = 0;
    }
  } else {
    abandonedRaw = await abandonStaleRawArticles();
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

  let qualityPurged: number | null = null;
  let qualityScanned: number | null = null;
  if (plan.purgeQuality) {
    const purge = await purgeLowQualityArticles();
    qualityPurged = purge.purged;
    qualityScanned = purge.scanned;
  }

  const remaining = {
    pendingRawArticles: await countPendingRawArticles(),
    pendingTranslationArticles: await countPendingTranslationArticles(fresh),
    stuckJobs: (await getOpsStatus()).stuckJobs,
  };

  const partial: Omit<OpsRecoverResult, "at" | "remaining"> = {
    clearedStaleLocks,
    releasedRunningJobs,
    abandonedRaw,
    rawBefore,
    rawAfter,
    rawNormalized,
    normalizePasses,
    translated,
    translationPending,
    collect,
    qualityPurged,
    qualityScanned,
    messages: [],
  };
  partial.messages = summarizeRecoverResult(partial);

  return {
    at: now.toISOString(),
    ...partial,
    remaining,
  };
}

/**
 * Unattended heal used by the ops-heal cron/job and translate preamble.
 * Always clears zombie locks and abandons out-of-window raw rows.
 * Optionally drains translations and starts collect when the feed is stale
 * (gated by OpsSetting.pipelineAutoHealCollect — off by default on Vercel).
 */
export async function runOpsAutoHeal(options: {
  translate?: boolean;
  triggerCollectIfStale?: boolean;
  /** Release every running job lock (pre-collect / GHA pre-heal). */
  forceLocks?: boolean;
  actorId?: string;
  forceEnabled?: boolean;
} = {}): Promise<OpsAutoHealResult> {
  await ensureDefaultJobs();
  const settings = await getOpsSettings();
  const at = new Date().toISOString();
  if (!options.forceEnabled && !settings.pipelineAutoHeal) {
    return {
      at,
      disabled: true,
      clearedStaleLocks: [],
      abandonedRaw: 0,
      translated: null,
      translationPending: null,
      collect: null,
      messages: ["Pipeline auto-heal is disabled in Operations settings."],
    };
  }

  let clearedStaleLocks = await clearStaleJobLocks();
  if (options.forceLocks) {
    const forced = await releaseAllRunningJobLocks();
    clearedStaleLocks = [...new Set([...clearedStaleLocks, ...forced])];
  }
  const abandonedRaw = await abandonStaleRawArticles();

  let translated: number | null = null;
  let translationPending: number | null = null;
  if (options.translate !== false) {
    const translation = await drainPendingTranslations(
      Math.min(8, limits.translateMaxPasses),
    );
    translated = translation.translated;
    translationPending = translation.pending;
  }

  let collect: OpsAutoHealResult["collect"] = null;
  const wantCollect = options.triggerCollectIfStale ?? settings.pipelineAutoHealCollect;
  if (wantCollect) {
    const collectJob = await prisma.scheduledJob.findUnique({
      where: { key: JOB_COLLECT },
      select: { lastStatus: true, lastRunAt: true, lockedUntil: true },
    });
    if (collectJob && shouldRunStaleCollect(collectJob, new Date())) {
      // Do not force while a live lock exists — shouldRunStaleCollect already
      // returns false when locked. Force only recovers interrupted/error states.
      const force = collectJob.lastStatus === "interrupted" || collectJob.lastStatus === "error";
      const result = await runScheduledJob(JOB_COLLECT, { force });
      collect = {
        ok: result.ok,
        skipped: result.skipped,
        message: result.message,
      };
    }
  }

  const messages: string[] = [];
  if (clearedStaleLocks.length) {
    messages.push(`Cleared zombie lock(s): ${clearedStaleLocks.join(", ")}.`);
  }
  if (abandonedRaw > 0) {
    messages.push(`Abandoned ${abandonedRaw} stale raw article(s).`);
  }
  if (translated != null && translated > 0) {
    messages.push(`Translated ${translated} article(s); ${translationPending ?? 0} still pending.`);
  }
  if (collect) {
    messages.push(collect.message);
  }
  if (!messages.length) {
    messages.push("Auto-heal: no blockers found.");
  }

  const actorId = options.actorId || OPS_SYSTEM_ACTOR_ID;
  await logAdminAction({
    actorId,
    action: "ops.auto_heal",
    targetType: "pipeline",
    targetId: "ops-heal",
    metadata: {
      clearedStaleLocks,
      abandonedRaw,
      translated,
      translationPending,
      collect,
      forceLocks: Boolean(options.forceLocks),
      messages,
    },
  }).catch((error) => {
    console.error("ops auto-heal audit log failed", error);
  });

  return {
    at,
    disabled: false,
    clearedStaleLocks,
    abandonedRaw,
    translated,
    translationPending,
    collect,
    messages,
  };
}
