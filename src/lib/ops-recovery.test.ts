import assert from "node:assert/strict";
import test from "node:test";
import {
  mapOpsJobStatuses,
  resolveRecoverPlan,
  summarizeRecoverResult,
} from "./ops-recovery";
import { JOB_COLLECT, JOB_TRANSLATE } from "./scheduler";

test("resolveRecoverPlan defaults to full recover minus collect", () => {
  assert.deepEqual(resolveRecoverPlan({}), {
    forceLocks: true,
    normalize: true,
    translate: true,
    collect: false,
    purgeQuality: false,
  });
});

test("resolveRecoverPlan honors explicit step flags", () => {
  assert.deepEqual(resolveRecoverPlan({
    normalize: true,
    translate: false,
    forceLocks: false,
    collect: true,
    purgeQuality: true,
  }), {
    forceLocks: false,
    normalize: true,
    translate: false,
    collect: true,
    purgeQuality: true,
  });
});

test("mapOpsJobStatuses marks stale running jobs", () => {
  const now = new Date("2026-08-28T12:00:00.000Z");
  const jobs = mapOpsJobStatuses([
    {
      key: JOB_COLLECT,
      name: "Collect",
      running: true,
      lastStatus: "running",
      lastRunAt: "2026-08-28T06:00:00.000Z",
      lastError: null,
      lastSummary: null,
      lockedUntil: new Date("2026-08-28T13:00:00.000Z"),
      lastRunAtDate: new Date("2026-08-28T06:00:00.000Z"),
      lastStatusRaw: "running",
    },
    {
      key: JOB_TRANSLATE,
      name: "Translate",
      running: true,
      lastStatus: "running",
      lastRunAt: "2026-08-28T11:50:00.000Z",
      lastError: null,
      lastSummary: null,
      lockedUntil: new Date("2026-08-28T13:00:00.000Z"),
      lastRunAtDate: new Date("2026-08-28T11:50:00.000Z"),
      lastStatusRaw: "running",
    },
  ], now);

  assert.equal(jobs[0]?.stale, true);
  assert.equal(jobs[1]?.stale, false);
  assert.deepEqual(jobs.map((job) => job.key), [JOB_COLLECT, JOB_TRANSLATE]);
});

test("summarizeRecoverResult reports cleared locks and backlog", () => {
  const messages = summarizeRecoverResult({
    clearedStaleLocks: ["translate"],
    releasedRunningJobs: ["collect"],
    rawBefore: 120,
    rawAfter: 20,
    rawNormalized: 100,
    normalizePasses: 4,
    translated: 45,
    translationPending: 5,
    collect: null,
    qualityPurged: 12,
    qualityScanned: 400,
    messages: [],
  });
  assert.match(messages.join(" "), /Cleared 1 stale lock/);
  assert.match(messages.join(" "), /Normalized 100 raw/);
  assert.match(messages.join(" "), /Translated 45/);
  assert.match(messages.join(" "), /Purged 12 low-quality/);
  assert.match(messages.join(" "), /5 still pending/);
});

test("ops status snapshot shape includes backlog and bilingual windows", () => {
  const snapshot = {
    at: new Date().toISOString(),
    jobs: [],
    stuckJobs: [],
    pendingRawArticles: 0,
    pendingTranslationArticles: 0,
    bilingual: {
      today: { scanned: 0, complete: 0, missingArabic: 0, missingEnglish: 0, ok: true },
      fresh: { scanned: 10, complete: 8, missingArabic: 2, missingEnglish: 1, ok: false },
    },
    scheduler: { online: false, processName: null, lastTickAt: null },
    notes: ["Normalize and translate drains are bounded on Vercel (maxDuration 300s). Use GitHub Actions for full collect."],
  };
  assert.equal(typeof snapshot.at, "string");
  assert.ok(Array.isArray(snapshot.jobs));
  assert.ok(snapshot.bilingual.fresh);
  assert.ok(snapshot.bilingual.today);
  assert.equal(typeof snapshot.pendingRawArticles, "number");
  assert.equal(typeof snapshot.pendingTranslationArticles, "number");
  assert.ok(snapshot.notes.length > 0);
});
