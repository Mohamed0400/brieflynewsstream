import assert from "node:assert/strict";
import test from "node:test";
import {
  COLLECT_PRESETS,
  DEFAULT_SCHEDULED_JOBS,
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
  assert.equal(collect?.cron, "*/30 * * * *");
  assert.equal(translate?.cron, "*/15 * * * *");
  assert.equal(publish?.cron, "0 6 * * *");
  for (const job of DEFAULT_SCHEDULED_JOBS) {
    assert.equal(isValidCron(job.cron), true, job.cron);
  }
});
