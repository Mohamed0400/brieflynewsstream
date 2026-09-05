import assert from "node:assert/strict";
import test from "node:test";
import {
  ageMs,
  isArabicFeedStale,
  shouldTriggerArabicFreshnessCollect,
  STALE_ARABIC_FEED_MAX_AGE_MS,
} from "./arabic-watchdog";

const NOW = new Date("2026-09-05T18:00:00.000Z");
const HOUR = 60 * 60 * 1000;

test("STALE_ARABIC_FEED_MAX_AGE_MS is 5 hours", () => {
  assert.equal(STALE_ARABIC_FEED_MAX_AGE_MS, 5 * HOUR);
});

test("ageMs returns null for missing dates and non-negative deltas", () => {
  assert.equal(ageMs(null, NOW), null);
  assert.equal(ageMs(undefined, NOW), null);
  assert.equal(ageMs(new Date(NOW.getTime() - 2 * HOUR), NOW), 2 * HOUR);
  assert.equal(ageMs(new Date(NOW.getTime() + HOUR), NOW), 0);
});

test("isArabicFeedStale treats missing or old createdAt as stale", () => {
  assert.equal(isArabicFeedStale(null, NOW), true);
  assert.equal(isArabicFeedStale(new Date(NOW.getTime() - STALE_ARABIC_FEED_MAX_AGE_MS - 1), NOW), true);
  assert.equal(isArabicFeedStale(new Date(NOW.getTime() - 2 * HOUR), NOW), false);
});

test("shouldTriggerArabicFreshnessCollect skips while arabic lock is live", () => {
  assert.equal(shouldTriggerArabicFreshnessCollect({
    now: NOW,
    newestArabicCreatedAt: new Date(NOW.getTime() - 10 * HOUR),
    job: {
      lastStatus: "running",
      lastRunAt: new Date(NOW.getTime() - HOUR),
      lockedUntil: new Date(NOW.getTime() + HOUR),
    },
  }), false);
});

test("shouldTriggerArabicFreshnessCollect fires on interrupted job or stale feed", () => {
  assert.equal(shouldTriggerArabicFreshnessCollect({
    now: NOW,
    newestArabicCreatedAt: new Date(NOW.getTime() - HOUR),
    job: {
      lastStatus: "interrupted",
      lastRunAt: new Date(NOW.getTime() - HOUR),
      lockedUntil: null,
    },
  }), true);

  assert.equal(shouldTriggerArabicFreshnessCollect({
    now: NOW,
    newestArabicCreatedAt: new Date(NOW.getTime() - STALE_ARABIC_FEED_MAX_AGE_MS - 1),
    job: {
      lastStatus: "ok",
      lastRunAt: new Date(NOW.getTime() - 2 * HOUR),
      lockedUntil: null,
    },
  }), true);
});

test("shouldTriggerArabicFreshnessCollect stays quiet when recent ok and feed fresh", () => {
  assert.equal(shouldTriggerArabicFreshnessCollect({
    now: NOW,
    newestArabicCreatedAt: new Date(NOW.getTime() - HOUR),
    job: {
      lastStatus: "ok",
      lastRunAt: new Date(NOW.getTime() - HOUR),
      lockedUntil: null,
    },
  }), false);
});
