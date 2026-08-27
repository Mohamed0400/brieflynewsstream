import cron from "node-cron";
import { prisma } from "./prisma";
import { describeQueryFailure } from "./api";
import { kuwaitDate } from "./market";
import { buildDailyEdition, MAX_TRANSLATION_PASSES, runPipeline } from "./pipeline";

export const JOB_COLLECT = "collect";
export const JOB_PUBLISH = "publish-daily";
export const JOB_TRANSLATE = "translate";
export const JOB_ARCHIVE = "archive";

const HEARTBEAT_ID = "default";
const HEARTBEAT_MS = 30_000;
/** At least the GitHub Actions collect timeout (180m); extra hour covers SIGTERM unwind. */
export const LOCK_MS = 4 * 60 * 60 * 1000;
/** Extend a live lock about once a minute so health polls cannot treat it as expired. */
export const LOCK_HEARTBEAT_MS = 60_000;
/** `--if-stale` collect no-ops when the last successful run is newer than this. */
export const STALE_COLLECT_MAX_AGE_MS = 4 * 60 * 60 * 1000;
const ONLINE_MS = 90_000;

export function isLockExpired(lockedUntil: Date | null | undefined, now: Date) {
  return lockedUntil != null && lockedUntil.getTime() <= now.getTime();
}

export function isCurrentlyLocked(lockedUntil: Date | null | undefined, now: Date) {
  return lockedUntil != null && lockedUntil.getTime() > now.getTime();
}

/**
 * A live claim always has lockedUntil in the future. Never treat previous-run
 * lastRunAt as a reason to steal that lock (health polls used to do exactly that).
 */
export function shouldClearStaleLock(
  job: {
    lastStatus: string | null;
    lockedUntil: Date | null;
    lastRunAt: Date | null;
  },
  now: Date,
) {
  if (job.lastStatus !== "running") return false;
  if (job.lockedUntil != null) return isLockExpired(job.lockedUntil, now);
  if (job.lastRunAt == null) return true;
  return now.getTime() - job.lastRunAt.getTime() >= LOCK_MS;
}

/** Watchdog: run collect when the last result is bad, old, or missing — not while locked. */
export function shouldRunStaleCollect(
  job: {
    lastStatus: string | null;
    lastRunAt: Date | null;
    lockedUntil: Date | null;
  },
  now: Date,
  maxAgeMs: number = STALE_COLLECT_MAX_AGE_MS,
) {
  if (isCurrentlyLocked(job.lockedUntil, now)) return false;
  if (job.lastStatus === "error" || job.lastStatus === "interrupted") return true;
  if (job.lastRunAt == null) return true;
  if (now.getTime() - job.lastRunAt.getTime() >= maxAgeMs) return true;
  return job.lastStatus !== "ok";
}

/** 06:00, 14:00, 22:00 in APP_TIMEZONE (Asia/Kuwait). */
export const COLLECT_THREE_TIMES_DAILY = "0 6,14,22 * * *";

export const COLLECT_PRESETS = [
  { value: COLLECT_THREE_TIMES_DAILY, label: "Three times daily (06:00, 14:00, 22:00)" },
  { value: "*/15 * * * *", label: "Every 15 minutes" },
  { value: "*/30 * * * *", label: "Every 30 minutes" },
  { value: "0 * * * *", label: "Every hour" },
  { value: "0 */2 * * *", label: "Every 2 hours" },
] as const;

export const PUBLISH_PRESETS = [
  { value: "0 6 * * *", label: "06:00 daily" },
  { value: "0 7 * * *", label: "07:00 daily" },
  { value: "0 8 * * *", label: "08:00 daily" },
  { value: "0 */6 * * *", label: "Every 6 hours" },
] as const;

export const TRANSLATE_PRESETS = [
  { value: "*/15 * * * *", label: "Every 15 minutes" },
  { value: "*/30 * * * *", label: "Every 30 minutes" },
  { value: "0 * * * *", label: "Every hour" },
] as const;

export const DEFAULT_SCHEDULED_JOBS = [
  {
    key: JOB_COLLECT,
    name: "Collect news",
    description: "Fetch every country source three times daily, store articles, fill markets below 3 stories, translate, and refresh today's edition.",
    cron: COLLECT_THREE_TIMES_DAILY,
  },
  {
    key: JOB_TRANSLATE,
    name: "Translate articles",
    description: "Store Arabic and English title and summary pairs for every fresh article.",
    cron: "*/15 * * * *",
  },
  {
    key: JOB_PUBLISH,
    name: "Publish today's edition",
    description: "Rebuild the stored /today edition from scored articles, then fill any missing ar/en pairs.",
    cron: "0 6 * * *",
  },
  {
    key: JOB_ARCHIVE,
    name: "Prune hot window",
    description:
      "Delete Supabase articles older than ARCHIVE_HOT_RETENTION_DAYS (default 5). If R2 is configured, upload cold archive first — see docs/R2-CLOUDFLARE-SETUP.md.",
    cron: "30 3 * * *",
  },
] as const;

type ScheduledTask = ReturnType<typeof cron.schedule>;

type SchedulerGlobal = typeof globalThis & {
  marketNewsScheduler?: {
    started: boolean;
    snapshot: string;
    tasks: ScheduledTask[];
    timer?: ReturnType<typeof setInterval>;
  };
};

function schedulerState() {
  const globalState = globalThis as SchedulerGlobal;
  if (!globalState.marketNewsScheduler) {
    globalState.marketNewsScheduler = { started: false, snapshot: "", tasks: [] };
  }
  return globalState.marketNewsScheduler;
}

function appTimezone() {
  return process.env.APP_TIMEZONE || "Asia/Kuwait";
}

export function isValidCron(expression: string) {
  return cron.validate(expression.trim());
}

function summarizePipeline(result: {
  rawCollected: number;
  articlesCreated: number;
  translated: number;
  editionItems: number;
  sourcesFailed: number;
  deferred?: number;
}) {
  return [
    `${result.rawCollected} collected`,
    `${result.articlesCreated} created`,
    `${result.translated} translated`,
    `${result.editionItems} in today's edition`,
    result.sourcesFailed ? `${result.sourcesFailed} source errors` : null,
    result.deferred ? `${result.deferred} deferred to next run` : null,
  ].filter(Boolean).join(", ");
}

/** Clear jobs whose lock timestamp has expired. Never uses lastRunAt while a lock is still valid. */
export async function clearStaleJobLocks() {
  const now = new Date();
  const running = await prisma.scheduledJob.findMany({
    where: { lastStatus: "running" },
    select: { key: true, lastStatus: true, lockedUntil: true, lastRunAt: true },
  });
  const staleKeys = running
    .filter((job) => shouldClearStaleLock(job, now))
    .map((job) => job.key);
  if (staleKeys.length === 0) return;
  await prisma.scheduledJob.updateMany({
    where: { key: { in: staleKeys } },
    data: {
      lockedUntil: null,
      lastStatus: "error",
      lastError: "Previous run was interrupted before completion.",
    },
  });
}

export async function releaseJobLock(key: string) {
  await prisma.scheduledJob.updateMany({
    where: { key, lastStatus: "running" },
    data: {
      lockedUntil: null,
      lastStatus: "error",
      lastError: "Run was interrupted before completion.",
    },
  });
}

export async function ensureDefaultJobs() {
  const timezone = appTimezone();
  await Promise.all(DEFAULT_SCHEDULED_JOBS.map((job) => (
    prisma.scheduledJob.upsert({
      where: { key: job.key },
      create: { ...job, timezone, enabled: true },
      update: {},
    })
  )));
}

export async function writeSchedulerHeartbeat(processName: string) {
  await prisma.schedulerHeartbeat.upsert({
    where: { id: HEARTBEAT_ID },
    create: { id: HEARTBEAT_ID, processName, lastTickAt: new Date() },
    update: { processName, lastTickAt: new Date() },
  });
}

async function executeJob(key: string) {
  if (key === JOB_PUBLISH) {
    const date = kuwaitDate();
    const itemCount = await buildDailyEdition(date, { force: true });
    return `Published ${itemCount} stories for ${date}`;
  }
  if (key === JOB_TRANSLATE) {
    const { translatePendingArticles } = await import("./article-translation");
    let translated = 0;
    let pending = 0;
    for (let pass = 0; pass < MAX_TRANSLATION_PASSES; pass += 1) {
      const result = await translatePendingArticles();
      translated += result.translated;
      pending = result.pending;
      if (result.pending === 0 || result.translated === 0) break;
    }
    return pending
      ? `${translated} articles translated, ${pending} still pending`
      : `${translated} articles translated`;
  }
  if (key === JOB_ARCHIVE) {
    const { runArchiveAndPrune } = await import("./archive/export");
    const result = await runArchiveAndPrune({ prune: true });
    if (!result.ok && !result.skipped) throw new Error(result.message);
    return result.message;
  }
  return summarizePipeline(await runPipeline({
    forceEdition: true,
    skipTranslation: process.env.CRON_COLLECT_ONLY === "true",
  }));
}

export async function runScheduledJob(key: string) {
  await clearStaleJobLocks();
  const now = new Date();
  const claimed = await prisma.scheduledJob.updateMany({
    where: {
      key,
      OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
    },
    data: {
      lastRunAt: now,
      lockedUntil: new Date(now.getTime() + LOCK_MS),
      lastStatus: "running",
      lastError: null,
    },
  });
  if (claimed.count === 0) {
    return { ok: false, skipped: true, message: "A collect or publish job is already running." };
  }

  const renewLock = setInterval(() => {
    void prisma.scheduledJob.updateMany({
      where: { key, lastStatus: "running" },
      data: { lockedUntil: new Date(Date.now() + LOCK_MS) },
    }).catch((error) => {
      console.error("scheduled job lock renew failed", key, error);
    });
  }, LOCK_HEARTBEAT_MS);

  try {
    const lastSummary = await executeJob(key);
    await prisma.scheduledJob.update({
      where: { key },
      data: {
        lastRunAt: new Date(),
        lastStatus: "ok",
        lastError: null,
        lastSummary,
        lockedUntil: null,
      },
    });
    return { ok: true, skipped: false, message: lastSummary };
  } catch (error) {
    console.error("scheduled job failed", key, error);
    const failure = describeQueryFailure(error);
    const lastError = failure.message;
    await prisma.scheduledJob.update({
      where: { key },
      data: {
        lastRunAt: new Date(),
        lastStatus: "error",
        lastError,
        lastSummary: null,
        lockedUntil: null,
      },
    });
    return { ok: false, skipped: false, message: lastError };
  } finally {
    clearInterval(renewLock);
  }
}

export async function updateScheduledJob(input: {
  key: string;
  cron?: string;
  enabled?: boolean;
}) {
  const job = await prisma.scheduledJob.findUnique({ where: { key: input.key } });
  if (!job) throw new Error("Unknown scheduled job.");
  const cronExpression = input.cron?.trim();
  if (cronExpression && !isValidCron(cronExpression)) {
    throw new Error("Cron expression is invalid. Use five fields, for example */30 * * * *.");
  }
  return prisma.scheduledJob.update({
    where: { key: input.key },
    data: {
      ...(cronExpression ? { cron: cronExpression, timezone: appTimezone() } : {}),
      ...(input.enabled === undefined ? {} : { enabled: input.enabled }),
    },
  });
}

function serializeJob(job: {
  key: string;
  name: string;
  description: string;
  cron: string;
  timezone: string;
  enabled: boolean;
  lastRunAt: Date | null;
  lastStatus: string | null;
  lastError: string | null;
  lastSummary: string | null;
  lockedUntil: Date | null;
}) {
  const running = Boolean(job.lockedUntil && job.lockedUntil > new Date());
  return {
    key: job.key,
    name: job.name,
    description: job.description,
    cron: job.cron,
    timezone: job.timezone,
    enabled: job.enabled,
    running,
    lastRunAt: job.lastRunAt?.toISOString() ?? null,
    lastStatus: running ? "running" : job.lastStatus,
    lastError: job.lastError,
    lastSummary: job.lastSummary,
    presets: job.key === JOB_PUBLISH || job.key === JOB_ARCHIVE
      ? PUBLISH_PRESETS
      : job.key === JOB_TRANSLATE
        ? TRANSLATE_PRESETS
        : COLLECT_PRESETS,
  };
}

export async function getScheduleSnapshot() {
  await ensureDefaultJobs();
  const [jobs, heartbeat, edition] = await Promise.all([
    prisma.scheduledJob.findMany({ orderBy: { name: "asc" } }),
    prisma.schedulerHeartbeat.findUnique({ where: { id: HEARTBEAT_ID } }),
    prisma.dailyEdition.findUnique({
      where: { date: kuwaitDate() },
      select: { date: true, status: true, itemCount: true, updatedAt: true },
    }),
  ]);
  const lastTickAt = heartbeat?.lastTickAt ?? null;
  const online = Boolean(lastTickAt && Date.now() - lastTickAt.getTime() < ONLINE_MS);
  return {
    timezone: appTimezone(),
    scheduler: {
      online,
      processName: heartbeat?.processName ?? null,
      lastTickAt: lastTickAt?.toISOString() ?? null,
    },
    today: {
      date: kuwaitDate(),
      exists: Boolean(edition),
      status: edition?.status.toLowerCase() ?? "missing",
      itemCount: edition?.itemCount ?? 0,
      updatedAt: edition?.updatedAt.toISOString() ?? null,
    },
    jobs: jobs.map(serializeJob),
  };
}

async function syncScheduledTasks(processName: string) {
  await ensureDefaultJobs();
  await writeSchedulerHeartbeat(processName);
  const jobs = await prisma.scheduledJob.findMany();
  const snapshot = JSON.stringify(jobs.map((job) => ({
    key: job.key,
    cron: job.cron,
    enabled: job.enabled,
    timezone: job.timezone,
  })));
  const state = schedulerState();
  if (snapshot === state.snapshot) return;
  for (const task of state.tasks) task.stop();
  state.tasks = [];
  state.snapshot = snapshot;
  for (const job of jobs) {
    if (!job.enabled || !isValidCron(job.cron)) continue;
    state.tasks.push(cron.schedule(
      job.cron,
      () => { void runScheduledJob(job.key); },
      { timezone: job.timezone },
    ));
  }
}

export function startEmbeddedScheduler(processName: string) {
  if (!embeddedSchedulerEnabled()) return;
  const state = schedulerState();
  if (state.started) return;
  state.started = true;
  const tick = () => {
    void syncScheduledTasks(processName).catch((error) => {
      console.error("Scheduler tick failed", error);
    });
  };
  tick();
  state.timer = setInterval(tick, HEARTBEAT_MS);
  if (typeof state.timer.unref === "function") state.timer.unref();
}

/** In-process node-cron only on a long-lived Node host. Vercel serverless sleeps. */
export function embeddedSchedulerEnabled() {
  if (process.env.ENABLE_EMBEDDED_SCHEDULER === "true") return true;
  if (process.env.ENABLE_EMBEDDED_SCHEDULER === "false") return false;
  if (process.env.VERCEL) return false;
  return true;
}
