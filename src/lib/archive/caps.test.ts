import assert from "node:assert/strict";
import test from "node:test";
import {
  articleCountCap,
  countCapFloorDate,
  countCapMinAgeHours,
  excessOverCap,
  filterOlderThanFloor,
  rawArticleCountCap,
} from "./caps";
import {
  archiveRawRetentionDays,
  archiveRetentionDays,
} from "./r2";

test("archiveRetentionDays defaults to 3 and clamps", () => {
  const prev = process.env.ARCHIVE_HOT_RETENTION_DAYS;
  delete process.env.ARCHIVE_HOT_RETENTION_DAYS;
  assert.equal(archiveRetentionDays(), 3);

  process.env.ARCHIVE_HOT_RETENTION_DAYS = "0";
  assert.equal(archiveRetentionDays(), 3);

  process.env.ARCHIVE_HOT_RETENTION_DAYS = "12";
  assert.equal(archiveRetentionDays(), 12);

  process.env.ARCHIVE_HOT_RETENTION_DAYS = "99";
  assert.equal(archiveRetentionDays(), 30);

  if (prev === undefined) delete process.env.ARCHIVE_HOT_RETENTION_DAYS;
  else process.env.ARCHIVE_HOT_RETENTION_DAYS = prev;
});

test("archiveRawRetentionDays defaults to 1 and never exceeds article retention", () => {
  const prevHot = process.env.ARCHIVE_HOT_RETENTION_DAYS;
  const prevRaw = process.env.ARCHIVE_RAW_RETENTION_DAYS;

  process.env.ARCHIVE_HOT_RETENTION_DAYS = "3";
  delete process.env.ARCHIVE_RAW_RETENTION_DAYS;
  assert.equal(archiveRawRetentionDays(), 1);

  process.env.ARCHIVE_RAW_RETENTION_DAYS = "2";
  assert.equal(archiveRawRetentionDays(), 2);

  process.env.ARCHIVE_RAW_RETENTION_DAYS = "10";
  assert.equal(archiveRawRetentionDays(), 3);

  process.env.ARCHIVE_HOT_RETENTION_DAYS = "1";
  process.env.ARCHIVE_RAW_RETENTION_DAYS = "2";
  assert.equal(archiveRawRetentionDays(), 1);

  if (prevHot === undefined) delete process.env.ARCHIVE_HOT_RETENTION_DAYS;
  else process.env.ARCHIVE_HOT_RETENTION_DAYS = prevHot;
  if (prevRaw === undefined) delete process.env.ARCHIVE_RAW_RETENTION_DAYS;
  else process.env.ARCHIVE_RAW_RETENTION_DAYS = prevRaw;
});

test("row caps default to Neon Free backstops", () => {
  const prevA = process.env.ARCHIVE_ARTICLE_COUNT_CAP;
  const prevR = process.env.ARCHIVE_RAW_COUNT_CAP;
  const prevH = process.env.ARCHIVE_COUNT_CAP_MIN_AGE_HOURS;
  delete process.env.ARCHIVE_ARTICLE_COUNT_CAP;
  delete process.env.ARCHIVE_RAW_COUNT_CAP;
  delete process.env.ARCHIVE_COUNT_CAP_MIN_AGE_HOURS;

  assert.equal(articleCountCap(), 20_000);
  assert.equal(rawArticleCountCap(), 25_000);
  assert.equal(countCapMinAgeHours(), 36);

  process.env.ARCHIVE_ARTICLE_COUNT_CAP = "0";
  assert.equal(articleCountCap(), 0);

  process.env.ARCHIVE_COUNT_CAP_MIN_AGE_HOURS = "12";
  assert.equal(countCapMinAgeHours(), 24);
  process.env.ARCHIVE_COUNT_CAP_MIN_AGE_HOURS = "96";
  assert.equal(countCapMinAgeHours(), 72);

  if (prevA === undefined) delete process.env.ARCHIVE_ARTICLE_COUNT_CAP;
  else process.env.ARCHIVE_ARTICLE_COUNT_CAP = prevA;
  if (prevR === undefined) delete process.env.ARCHIVE_RAW_COUNT_CAP;
  else process.env.ARCHIVE_RAW_COUNT_CAP = prevR;
  if (prevH === undefined) delete process.env.ARCHIVE_COUNT_CAP_MIN_AGE_HOURS;
  else process.env.ARCHIVE_COUNT_CAP_MIN_AGE_HOURS = prevH;
});

test("excessOverCap and soft-floor filter keep recent articles", () => {
  assert.equal(excessOverCap(19_000, 20_000), 0);
  assert.equal(excessOverCap(22_500, 20_000), 2_500);
  assert.equal(excessOverCap(10, 0), 0);

  const now = new Date("2026-09-05T12:00:00.000Z");
  const floor = countCapFloorDate(now, 36);
  assert.equal(floor.toISOString(), "2026-09-04T00:00:00.000Z");

  const rows = [
    { id: "old", publishedAt: new Date("2026-09-03T00:00:00.000Z") },
    { id: "edge", publishedAt: new Date("2026-09-04T00:00:00.000Z") },
    { id: "fresh", publishedAt: new Date("2026-09-05T06:00:00.000Z") },
  ];
  const deletable = filterOlderThanFloor(rows, floor);
  assert.deepEqual(deletable.map((row) => row.id), ["old"]);
});
