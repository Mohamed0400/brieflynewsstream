import assert from "node:assert/strict";
import test from "node:test";
import {
  COLLECT_PRESETS,
  COLLECT_THREE_TIMES_DAILY,
  DEFAULT_SCHEDULED_JOBS,
  embeddedSchedulerEnabled,
  isLockExpired,
  isValidCron,
  JOB_COLLECT,
  JOB_PUBLISH,
  JOB_TRANSLATE,
  LOCK_MS,
  PUBLISH_PRESETS,
  shouldClearStaleLock,
  shouldRunStaleCollect,
  STALE_COLLECT_MAX_AGE_MS,
  TRANSLATE_PRESETS,
} from "./scheduler";

test("default schedule presets are valid five-field cron", () => {
  for (const preset of [...COLLECT_PRESETS, ...PUBLISH_PRESETS, ...TRANSLATE_PRESETS]) {
    assert.equal(isValidCron(preset.value), true, preset.value);
  }
  assert.equal(isValidCron("not-a-schedule"), false);
  assert.equal(isValidCron(""), false);
});

test("production cron jobs collect, translate, and publish bilingual articles", () => {
  const keys = DEFAULT_SCHEDULED_JOBS.map((job) => job.key);
  assert.deepEqual(keys, [JOB_COLLECT, JOB_TRANSLATE, JOB_PUBLISH]);
  const collect = DEFAULT_SCHEDULED_JOBS.find((job) => job.key === JOB_COLLECT);
  const translate = DEFAULT_SCHEDULED_JOBS.find((job) => job.key === JOB_TRANSLATE);
  const publish = DEFAULT_SCHEDULED_JOBS.find((job) => job.key === JOB_PUBLISH);
  assert.equal(collect?.cron, COLLECT_THREE_TIMES_DAILY);
  assert.equal(isValidCron(COLLECT_THREE_TIMES_DAILY), true);
  assert.equal(translate?.cron, "*/15 * * * *");
  assert.equal(publish?.cron, "0 6 * * *");
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

test("shouldClearStaleLock never steals a live lock because lastRunAt is old", () => {
  const now = new Date("2026-08-25T09:00:00.000Z");
  const daysAgo = new Date("2026-08-23T14:37:59.000Z");
  const futureLock = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  assert.equal(shouldClearStaleLock({
    lastStatus: "running",
    lockedUntil: futureLock,
    lastRunAt: daysAgo,
  }, now), false);
});

test("shouldClearStaleLock releases only expired or lockless-stale running claims", () => {
  const now = new Date("2026-08-25T09:00:00.000Z");
  const expired = new Date("2026-08-25T08:00:00.000Z");
  const recentStart = new Date("2026-08-25T08:30:00.000Z");
  const staleStart = new Date(now.getTime() - LOCK_MS - 1);
  assert.equal(shouldClearStaleLock({
    lastStatus: "running",
    lockedUntil: expired,
    lastRunAt: recentStart,
  }, now), true);
  assert.equal(shouldClearStaleLock({
    lastStatus: "running",
    lockedUntil: null,
    lastRunAt: staleStart,
  }, now), true);
  assert.equal(shouldClearStaleLock({
    lastStatus: "running",
    lockedUntil: null,
    lastRunAt: null,
  }, now), true);
  assert.equal(shouldClearStaleLock({
    lastStatus: "running",
    lockedUntil: null,
    lastRunAt: recentStart,
  }, now), false);
  assert.equal(shouldClearStaleLock({
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
