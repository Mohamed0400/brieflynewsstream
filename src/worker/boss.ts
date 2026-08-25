import PgBoss from "pg-boss";
import { prisma } from "../lib/prisma";
import {
  DEFAULT_SCHEDULED_JOBS,
  ensureDefaultJobs,
  isValidCron,
  LOCK_MS,
  releaseJobLock,
  runScheduledJob,
  writeSchedulerHeartbeat,
} from "../lib/scheduler";

const QUEUE_PREFIX = "brieflynewsstream";
const PROCESS_NAME = "pg-boss-worker";
const HEARTBEAT_MS = 30_000;
const JOB_EXPIRE_SECONDS = Math.ceil(LOCK_MS / 1000);
const activeJobKeys = new Set<ScheduledJobKey>();

type ScheduledJobKey = typeof DEFAULT_SCHEDULED_JOBS[number]["key"];
type BossJobData = {
  key: ScheduledJobKey;
  source: "pg-boss-cron";
};

function bossConnectionString() {
  const url = process.env.PG_BOSS_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("PG_BOSS_DATABASE_URL, DIRECT_URL, or DATABASE_URL must be set to run the pg-boss worker.");
  }
  return url;
}

function queueName(key: string) {
  return `${QUEUE_PREFIX}.${key}`;
}

function isScheduledJobKey(key: string): key is ScheduledJobKey {
  return DEFAULT_SCHEDULED_JOBS.some((job) => job.key === key);
}

function createBoss() {
  // pg-boss gives us Celery-like durable cron/jobs using the existing Supabase Postgres,
  // avoiding a new Redis service while preserving cross-process delivery and retries.
  const boss = new PgBoss({
    connectionString: bossConnectionString(),
    schema: process.env.PG_BOSS_SCHEMA || "pgboss",
    schedule: true,
    migrate: true,
    supervise: true,
    // pg-boss asserts cron intervals are 1-45s; defaults (30s monitor, 5s worker) are fine.
    cronWorkerIntervalSeconds: 5,
  });
  boss.on("error", (error) => console.error("pg-boss error", error));
  return boss;
}

type ScheduleSyncState = { snapshot: string };

async function syncBossSchedules(boss: PgBoss, state: ScheduleSyncState) {
  await ensureDefaultJobs();
  const jobs = await prisma.scheduledJob.findMany({ orderBy: { key: "asc" } });

  // Console Schedule page edits live in the DB; only touch pg-boss when they change.
  const snapshot = JSON.stringify(jobs.map((job) => ({
    key: job.key,
    cron: job.cron,
    enabled: job.enabled,
    timezone: job.timezone,
  })));
  if (snapshot === state.snapshot) return;
  state.snapshot = snapshot;

  for (const job of jobs) {
    if (!isScheduledJobKey(job.key)) continue;
    const name = queueName(job.key);

    await boss.createQueue(name, {
      name,
      policy: "singleton",
      retryLimit: 1,
      retryDelay: 60,
      retryBackoff: true,
      expireInSeconds: JOB_EXPIRE_SECONDS,
      // createQueue only reads retentionMinutes; retentionDays is ignored at queue level.
      retentionMinutes: 7 * 24 * 60,
    });

    if (!job.enabled || !isValidCron(job.cron)) {
      await boss.unschedule(name);
      continue;
    }

    await boss.schedule(
      name,
      job.cron,
      { key: job.key, source: "pg-boss-cron" } satisfies BossJobData,
      {
        tz: job.timezone,
        retryLimit: 1,
        retryDelay: 60,
        retryBackoff: true,
        expireInSeconds: JOB_EXPIRE_SECONDS,
        retentionDays: 7,
      },
    );
  }
}

async function registerWorkers(boss: PgBoss) {
  for (const job of DEFAULT_SCHEDULED_JOBS) {
    await boss.work<BossJobData>(
      queueName(job.key),
      { batchSize: 1, pollingIntervalSeconds: 5 },
      async ([queuedJob]) => {
        const key = queuedJob?.data?.key || job.key;
        activeJobKeys.add(key);
        try {
          const result = await runScheduledJob(key);
          if (!result.ok && !result.skipped) {
            throw new Error(result.message);
          }
          return result;
        } finally {
          activeJobKeys.delete(key);
        }
      },
    );
  }
}

function startHeartbeat(boss: PgBoss, state: ScheduleSyncState) {
  const tick = () => {
    void (async () => {
      await writeSchedulerHeartbeat(PROCESS_NAME);
      await syncBossSchedules(boss, state);
    })().catch((error) => {
      console.error("pg-boss heartbeat failed", error);
    });
  };
  tick();
  const timer = setInterval(tick, HEARTBEAT_MS);
  return timer;
}

async function releaseKnownLocks() {
  await Promise.all([...activeJobKeys].map((key) => releaseJobLock(key)));
}

export async function startBossWorker() {
  const boss = createBoss();
  await boss.start();
  const syncState: ScheduleSyncState = { snapshot: "" };
  await syncBossSchedules(boss, syncState);
  await registerWorkers(boss);

  const timer = startHeartbeat(boss, syncState);
  const timezone = process.env.APP_TIMEZONE || "Asia/Kuwait";
  console.log(`pg-boss worker started (timezone ${timezone}, schema ${process.env.PG_BOSS_SCHEMA || "pgboss"}).`);
  console.log("Durable schedules are loaded from the database Schedule page.");

  const stop = async () => {
    clearInterval(timer);
    // Graceful stop first: handlers that finish in the grace window release their own
    // locks. Releasing beforehand would let another runner claim a job still executing here.
    await boss.stop({ graceful: true, close: true });
    await releaseKnownLocks();
  };

  return { boss, stop };
}

