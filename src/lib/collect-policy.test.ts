import assert from "node:assert/strict";
import test from "node:test";
import {
  budgetRemainingMs,
  collectDeadline,
  shouldFetchSource,
  shouldStartAnotherFetch,
  sortSourcesOldestStaleFirst,
} from "./collect-policy";

const INTERVALS = {
  collectRefreshHours: 4,
  nationalitySearchIntervalHours: 12,
};

function hoursAgo(hours: number, now = Date.now()) {
  return new Date(now - hours * 60 * 60 * 1000);
}

test("skips a recent successful fetch", () => {
  const now = Date.parse("2026-08-25T06:00:00.000Z");
  assert.equal(shouldFetchSource({
    lastFetchedAt: hoursAgo(1, now),
    lastError: null,
    adapter: "rss",
  }, { ...INTERVALS, now }), false);
});

test("skips a recent error so failed sources back off", () => {
  const now = Date.parse("2026-08-25T06:00:00.000Z");
  assert.equal(shouldFetchSource({
    lastFetchedAt: hoursAgo(1, now),
    lastError: "fetch failed: timeout",
    adapter: "rss",
  }, { ...INTERVALS, now }), false);
});

test("fetches when lastFetchedAt is old even with lastError", () => {
  const now = Date.parse("2026-08-25T06:00:00.000Z");
  assert.equal(shouldFetchSource({
    lastFetchedAt: hoursAgo(5, now),
    lastError: "fetch failed: timeout",
    adapter: "rss",
  }, { ...INTERVALS, now }), true);
});

test("fetches a source that has never been fetched", () => {
  assert.equal(shouldFetchSource({
    lastFetchedAt: null,
    lastError: null,
    adapter: "rss",
  }, INTERVALS), true);
});

test("forceCollect fetches a recent success or recent error", () => {
  const now = Date.parse("2026-08-25T06:00:00.000Z");
  assert.equal(shouldFetchSource({
    lastFetchedAt: hoursAgo(0.5, now),
    lastError: null,
    adapter: "rss",
  }, { ...INTERVALS, now, forceCollect: true }), true);
  assert.equal(shouldFetchSource({
    lastFetchedAt: hoursAgo(0.5, now),
    lastError: "timeout",
    adapter: "rss",
  }, { ...INTERVALS, now, forceCollect: true }), true);
});

test("nationality search keeps its longer interval", () => {
  const now = Date.parse("2026-08-25T06:00:00.000Z");
  assert.equal(shouldFetchSource({
    lastFetchedAt: hoursAgo(5, now),
    lastError: null,
    adapter: "gemini-nationality-search",
  }, { ...INTERVALS, now }), false);
  assert.equal(shouldFetchSource({
    lastFetchedAt: hoursAgo(13, now),
    lastError: "interrupted",
    adapter: "gemini-nationality-search",
  }, { ...INTERVALS, now }), true);
});

test("shouldStartAnotherFetch and budget remaining honor the deadline", () => {
  const now = 1_000;
  const deadline = collectDeadline(now, 2_400_000);
  assert.equal(deadline, 2_401_000);
  assert.equal(shouldStartAnotherFetch(now, deadline), true);
  assert.equal(shouldStartAnotherFetch(deadline - 1, deadline), true);
  assert.equal(shouldStartAnotherFetch(deadline, deadline), false);
  assert.equal(shouldStartAnotherFetch(deadline + 50, deadline), false);
  assert.equal(budgetRemainingMs(now, deadline), 2_400_000);
  assert.equal(budgetRemainingMs(deadline, deadline), 0);
  assert.equal(budgetRemainingMs(deadline + 10, deadline), 0);
  assert.equal(collectDeadline(now, 0), Number.POSITIVE_INFINITY);
  assert.equal(shouldStartAnotherFetch(now, Number.POSITIVE_INFINITY), true);
});

test("sorts never-fetched and oldest lastFetchedAt first", () => {
  const now = Date.parse("2026-08-25T06:00:00.000Z");
  const ordered = sortSourcesOldestStaleFirst([
    { id: "recent", lastFetchedAt: hoursAgo(1, now) },
    { id: "never", lastFetchedAt: null },
    { id: "oldest", lastFetchedAt: hoursAgo(20, now) },
    { id: "mid", lastFetchedAt: hoursAgo(8, now) },
  ]);
  assert.deepEqual(ordered.map((source) => source.id), ["never", "oldest", "mid", "recent"]);
});
