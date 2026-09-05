import assert from "node:assert/strict";
import test from "node:test";
import {
  archiveRawRetentionDays,
  archiveRetentionDays,
} from "./r2";

test("archiveRetentionDays defaults to 5 and clamps", () => {
  const prev = process.env.ARCHIVE_HOT_RETENTION_DAYS;
  delete process.env.ARCHIVE_HOT_RETENTION_DAYS;
  assert.equal(archiveRetentionDays(), 5);

  process.env.ARCHIVE_HOT_RETENTION_DAYS = "0";
  assert.equal(archiveRetentionDays(), 5);

  process.env.ARCHIVE_HOT_RETENTION_DAYS = "12";
  assert.equal(archiveRetentionDays(), 12);

  process.env.ARCHIVE_HOT_RETENTION_DAYS = "99";
  assert.equal(archiveRetentionDays(), 30);

  if (prev === undefined) delete process.env.ARCHIVE_HOT_RETENTION_DAYS;
  else process.env.ARCHIVE_HOT_RETENTION_DAYS = prev;
});

test("archiveRawRetentionDays defaults to 2 and never exceeds article retention", () => {
  const prevHot = process.env.ARCHIVE_HOT_RETENTION_DAYS;
  const prevRaw = process.env.ARCHIVE_RAW_RETENTION_DAYS;

  process.env.ARCHIVE_HOT_RETENTION_DAYS = "5";
  delete process.env.ARCHIVE_RAW_RETENTION_DAYS;
  assert.equal(archiveRawRetentionDays(), 2);

  process.env.ARCHIVE_RAW_RETENTION_DAYS = "1";
  assert.equal(archiveRawRetentionDays(), 1);

  process.env.ARCHIVE_RAW_RETENTION_DAYS = "10";
  assert.equal(archiveRawRetentionDays(), 5);

  process.env.ARCHIVE_HOT_RETENTION_DAYS = "1";
  process.env.ARCHIVE_RAW_RETENTION_DAYS = "2";
  assert.equal(archiveRawRetentionDays(), 1);

  if (prevHot === undefined) delete process.env.ARCHIVE_HOT_RETENTION_DAYS;
  else process.env.ARCHIVE_HOT_RETENTION_DAYS = prevHot;
  if (prevRaw === undefined) delete process.env.ARCHIVE_RAW_RETENTION_DAYS;
  else process.env.ARCHIVE_RAW_RETENTION_DAYS = prevRaw;
});
