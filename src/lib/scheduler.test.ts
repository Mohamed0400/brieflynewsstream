import assert from "node:assert/strict";
import test from "node:test";
import {
  COLLECT_PRESETS,
  COLLECT_THREE_TIMES_DAILY,
  DEFAULT_SCHEDULED_JOBS,
  embeddedSchedulerEnabled,
  isValidCron,
  JOB_COLLECT,
  JOB_PUBLISH,
  JOB_TRANSLATE,
  PUBLISH_PRESETS,
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
