import assert from "node:assert/strict";
import test from "node:test";
import {
  isWithinNewsFreshnessWindow,
  newsFreshnessCutoff,
} from "./news-freshness";
import { limits } from "./limits";

test("newsFreshnessCutoff is newsMaxAgeHours behind now", () => {
  const now = new Date("2026-08-29T12:00:00.000Z");
  const cutoff = newsFreshnessCutoff(now);
  assert.equal(
    cutoff.toISOString(),
    new Date(now.getTime() - limits.newsMaxAgeHours * 3_600_000).toISOString(),
  );
});

test("isWithinNewsFreshnessWindow rejects stale publish dates", () => {
  const now = new Date("2026-08-29T12:00:00.000Z");
  assert.equal(isWithinNewsFreshnessWindow(new Date("2026-06-09T07:00:00.000Z"), now), false);
  assert.equal(isWithinNewsFreshnessWindow(new Date("2026-08-28T12:00:00.000Z"), now), true);
  assert.equal(isWithinNewsFreshnessWindow(new Date("2026-08-26T11:59:00.000Z"), now), false);
});
