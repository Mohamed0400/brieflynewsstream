import assert from "node:assert/strict";
import test from "node:test";
import {
  COLLECT_PRESETS,
  COLLECT_THREE_TIMES_DAILY,
  DEFAULT_SCHEDULED_JOBS,
  embeddedSchedulerEnabled,
  isLockExpired,
  isValidCron,
  isZombieLock,
  JOB_COLLECT,
  JOB_PUBLISH,
  JOB_TRANSLATE,
  JOB_ARCHIVE,
  LOCK_MS,
  LOCK_ZOMBIE_MS,
  PUBLISH_PRESETS,
  shouldClearStaleLock,
  shouldRunStaleCollect,
  STALE_COLLECT_MAX_AGE_MS,
  TRANSLATE_PRESETS,
  jobLockMs,
} from "./scheduler";

test("default schedule presets are valid five-field cron", () => {
  for (const preset of [...COLLECT_PRESETS, ...PUBLISH_PRESETS, ...TRANSLATE_PRESETS]) {
    assert.equal(isValidCron(preset.value), true, preset.value);
  }
  assert.equal(isValidCron("not-a-schedule"), false);
  assert.equal(isValidCron(""), false);
});

test("production cron jobs collect, translate, publish, and archive", () => {
  const keys = DEFAULT_SCHEDULED_JOBS.map((job) => job.key);
  assert.deepEqual(keys, [JOB_COLLECT, JOB_TRANSLATE, JOB_PUBLISH, JOB_ARCHIVE]);
  const collect = DEFAULT_SCHEDULED_JOBS.find((job) => job.key === JOB_COLLECT);
  const translate = DEFAULT_SCHEDULED_JOBS.find((job) => job.key === JOB_TRANSLATE);
  const publish = DEFAULT_SCHEDULED_JOBS.find((job) => job.key === JOB_PUBLISH);
  const archive = DEFAULT_SCHEDULED_JOBS.find((job) => job.key === JOB_ARCHIVE);
  assert.equal(collect?.cron, COLLECT_THREE_TIMES_DAILY);
  assert.equal(isValidCron(COLLECT_THREE_TIMES_DAILY), true);
  assert.equal(translate?.cron, "*/15 * * * *");
  assert.equal(publish?.cron, "0 6 * * *");
  assert.equal(archive?.cron, "30 3 * * *");
  for (const job of DEFAULT_SCHEDULED_JOBS) {
    assert.equal(isValidCron(job.cron), true, job.cron);
  }
});

test("embedded node-cron is off on Vercel unless forced", () => {
  const previousVercel = process.env.VERCEL;
  const previousFlag = process.env.ENABLE_EMBEDDED_SCHEDULER;
  process.env.VERCEL = "1";
  delete process.env.ENABLE_EMBEDDED_SCHEDULER;
  assert.equal(embeddedSchedulerEnabled(), false);
  process.env.ENABLE_EMBEDDED_SCHEDULER = "true";
  assert.equal(embeddedSchedulerEnabled(), true);
  delete process.env.VERCEL;
  delete process.env.ENABLE_EMBEDDED_SCHEDULER;
  assert.equal(embeddedSchedulerEnabled(), true);
  if (previousVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = previousVercel;
  if (previousFlag === undefined) delete process.env.ENABLE_EMBEDDED_SCHEDULER;
  else process.env.ENABLE_EMBEDDED_SCHEDULER = previousFlag;
});

test("LOCK_MS is at least 3 hours to cover GitHub collect timeout-minutes", () => {
  assert.ok(LOCK_MS >= 3 * 60 * 60 * 1000);
});

test("isLockExpired is true only when lockedUntil is at or before now", () => {
  const now = new Date("2026-08-25T09:00:00.000Z");
  assert.equal(isLockExpired(null, now), false);
  assert.equal(isLockExpired(undefined, now), false);
  assert.equal(isLockExpired(new Date("2026-08-25T12:00:00.000Z"), now), false);
  assert.equal(isLockExpired(new Date("2026-08-25T08:59:59.000Z"), now), true);
  assert.equal(isLockExpired(now, now), true);
});

test("job-specific lock windows keep short jobs from inheriting collect duration", () => {
  assert.ok(jobLockMs(JOB_COLLECT) >= LOCK_MS);
  assert.ok(jobLockMs(JOB_TRANSLATE) < jobLockMs(JOB_COLLECT));
});

test("isZombieLock uses heartbeat age from lockedUntil inversion", () => {
  const now = new Date("2026-08-28T16:25:00.000Z");
  const lockMs = jobLockMs(JOB_COLLECT);
  assert.ok(LOCK_ZOMBIE_MS >= 3 * 60_000);
  assert.equal(isZombieLock({
    key: JOB_COLLECT,
    lastStatus: "running",
    lockedUntil: new Date(now.getTime() + lockMs - 10 * 60 * 1000),
  }, now), true);
  assert.equal(isZombieLock({
    key: JOB_COLLECT,
    lastStatus: "running",
    lockedUntil: new Date(now.getTime() + lockMs - 30_000),
  }, now), false);
  assert.equal(isZombieLock({
    key: JOB_COLLECT,
    lastStatus: "ok",
    lockedUntil: new Date(now.getTime() + lockMs - 10 * 60 * 1000),
  }, now), false);
});

test("shouldClearStaleLock releases zombie locks when heartbeats stop", () => {
  const now = new Date("2026-08-28T16:25:00.000Z");
  const lockMs = jobLockMs(JOB_COLLECT);
  // Claimed ~10 minutes ago; lock never renewed → heartbeat age ≈ 10m.
  const lockedUntil = new Date(now.getTime() + lockMs - 10 * 60 * 1000);
  assert.equal(shouldClearStaleLock({
    key: JOB_COLLECT,
    lastStatus: "running",
    lockedUntil,
    lastRunAt: new Date(now.getTime() - 10 * 60 * 1000),
  }, now), true);

  // Live heartbeat within the last minute keeps the lock.
  const liveLock = new Date(now.getTime() + lockMs - 30_000);
  assert.equal(shouldClearStaleLock({
    key: JOB_COLLECT,
    lastStatus: "running",
    lockedUntil: liveLock,
    lastRunAt: new Date(now.getTime() - 30 * 60 * 1000),
  }, now), false);
});

test("shouldClearStaleLock releases zombie translate locks even when lockedUntil is renewed", () => {
  const now = new Date("2026-08-25T09:00:00.000Z");
  const staleTranslateStart = new Date(now.getTime() - jobLockMs(JOB_TRANSLATE) - 1);
  // Translate past its max runtime even if lockedUntil looks fresh.
  assert.equal(shouldClearStaleLock({
    key: JOB_TRANSLATE,
    lastStatus: "running",
    lockedUntil: new Date(now.getTime() + jobLockMs(JOB_TRANSLATE) - 30_000),
    lastRunAt: staleTranslateStart,
  }, now), true);
  // Collect still inside its window with a recently renewed heartbeat stays locked.
  assert.equal(shouldClearStaleLock({
    key: JOB_COLLECT,
    lastStatus: "running",
    lockedUntil: new Date(now.getTime() + jobLockMs(JOB_COLLECT) - 30_000),
    lastRunAt: new Date(now.getTime() - 30 * 60 * 1000),
  }, now), false);
});

test("shouldClearStaleLock releases only expired or lockless-stale running claims", () => {
  const now = new Date("2026-08-25T09:00:00.000Z");
  const expired = new Date("2026-08-25T08:00:00.000Z");
  const recentStart = new Date("2026-08-25T08:30:00.000Z");
  const staleStart = new Date(now.getTime() - LOCK_MS - 1);
  assert.equal(shouldClearStaleLock({
    key: JOB_COLLECT,
    lastStatus: "running",
    lockedUntil: expired,
    lastRunAt: recentStart,
  }, now), true);
  assert.equal(shouldClearStaleLock({
    key: JOB_COLLECT,
    lastStatus: "running",
    lockedUntil: null,
    lastRunAt: staleStart,
  }, now), true);
  assert.equal(shouldClearStaleLock({
    key: JOB_COLLECT,
    lastStatus: "running",
    lockedUntil: null,
    lastRunAt: null,
  }, now), true);
  assert.equal(shouldClearStaleLock({
    key: JOB_COLLECT,
    lastStatus: "running",
    lockedUntil: null,
    lastRunAt: recentStart,
  }, now), false);
  assert.equal(shouldClearStaleLock({
    key: JOB_COLLECT,
    lastStatus: "ok",
    lockedUntil: expired,
    lastRunAt: staleStart,
  }, now), false);
});

test("shouldRunStaleCollect is true for error, interrupted, or old runs", () => {
  const now = new Date("2026-08-25T09:00:00.000Z");
  const recent = new Date(now.getTime() - 30 * 60 * 1000);
  const old = new Date(now.getTime() - STALE_COLLECT_MAX_AGE_MS - 1);

  assert.equal(shouldRunStaleCollect({
    lastStatus: "error",
    lastRunAt: recent,
    lockedUntil: null,
  }, now, STALE_COLLECT_MAX_AGE_MS), true);
  assert.equal(shouldRunStaleCollect({
    lastStatus: "interrupted",
    lastRunAt: recent,
    lockedUntil: null,
  }, now, STALE_COLLECT_MAX_AGE_MS), true);
  assert.equal(shouldRunStaleCollect({
    lastStatus: "ok",
    lastRunAt: old,
    lockedUntil: null,
  }, now, STALE_COLLECT_MAX_AGE_MS), true);
  assert.equal(shouldRunStaleCollect({
    lastStatus: null,
    lastRunAt: null,
    lockedUntil: null,
  }, now, STALE_COLLECT_MAX_AGE_MS), true);
});

test("shouldRunStaleCollect is false when collect is recent ok or currently locked", () => {
  const now = new Date("2026-08-25T09:00:00.000Z");
  const recent = new Date(now.getTime() - 30 * 60 * 1000);
  const daysAgo = new Date("2026-08-23T14:37:59.000Z");
  const liveLock = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  assert.equal(shouldRunStaleCollect({
    lastStatus: "ok",
    lastRunAt: recent,
    lockedUntil: null,
  }, now, STALE_COLLECT_MAX_AGE_MS), false);
  assert.equal(shouldRunStaleCollect({
    lastStatus: "running",
    lastRunAt: daysAgo,
    lockedUntil: liveLock,
  }, now, STALE_COLLECT_MAX_AGE_MS), false);
  assert.equal(shouldRunStaleCollect({
    lastStatus: "ok",
    lastRunAt: recent,
    lockedUntil: liveLock,
  }, now, STALE_COLLECT_MAX_AGE_MS), false);
});
