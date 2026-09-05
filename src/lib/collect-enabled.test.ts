import assert from "node:assert/strict";
import test from "node:test";
import { isArabicCollectEnabled, isMainCollectEnabled } from "./collect-enabled";

test("isMainCollectEnabled defaults on and respects kill switch", () => {
  const prev = process.env.MAIN_COLLECT_ENABLED;
  delete process.env.MAIN_COLLECT_ENABLED;
  assert.equal(isMainCollectEnabled(), true);
  process.env.MAIN_COLLECT_ENABLED = "false";
  assert.equal(isMainCollectEnabled(), false);
  process.env.MAIN_COLLECT_ENABLED = "true";
  assert.equal(isMainCollectEnabled(), true);
  if (prev === undefined) delete process.env.MAIN_COLLECT_ENABLED;
  else process.env.MAIN_COLLECT_ENABLED = prev;
});

test("isArabicCollectEnabled stays off unless enabled or forced", () => {
  const prev = process.env.ARABIC_COLLECT_ENABLED;
  const prevForce = process.env.ARABIC_COLLECT_FORCE;
  delete process.env.ARABIC_COLLECT_ENABLED;
  delete process.env.ARABIC_COLLECT_FORCE;
  assert.equal(isArabicCollectEnabled(), false);
  process.env.ARABIC_COLLECT_FORCE = "true";
  assert.equal(isArabicCollectEnabled(), true);
  process.env.ARABIC_COLLECT_ENABLED = "false";
  assert.equal(isArabicCollectEnabled(), false);
  if (prev === undefined) delete process.env.ARABIC_COLLECT_ENABLED;
  else process.env.ARABIC_COLLECT_ENABLED = prev;
  if (prevForce === undefined) delete process.env.ARABIC_COLLECT_FORCE;
  else process.env.ARABIC_COLLECT_FORCE = prevForce;
});
