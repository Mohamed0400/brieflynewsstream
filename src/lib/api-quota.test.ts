import assert from "node:assert/strict";
import test from "node:test";
import {
  canIssueApiKey,
  isQuotaExceeded,
  quotaRemaining,
  quotaResponseHeaders,
  quotaUsagePercent,
} from "./api-quota";
import { PLAN_DEFINITIONS } from "./plans";

test("free plan quota is account-wide with one key", () => {
  assert.equal(PLAN_DEFINITIONS.FREE.dailyRequests, 3);
  assert.equal(PLAN_DEFINITIONS.FREE.maxKeys, 1);
  assert.equal(canIssueApiKey(0, PLAN_DEFINITIONS.FREE.maxKeys), true);
  assert.equal(canIssueApiKey(1, PLAN_DEFINITIONS.FREE.maxKeys), false);
});

test("pro plan allows ten keys sharing one daily pool", () => {
  assert.equal(PLAN_DEFINITIONS.PRO.dailyRequests, 500);
  assert.equal(PLAN_DEFINITIONS.PRO.maxKeys, 10);
  assert.equal(canIssueApiKey(9, PLAN_DEFINITIONS.PRO.maxKeys), true);
  assert.equal(canIssueApiKey(10, PLAN_DEFINITIONS.PRO.maxKeys), false);
});

test("quota math blocks the next request at the daily cap", () => {
  const limit = PLAN_DEFINITIONS.FREE.dailyRequests;
  assert.equal(isQuotaExceeded(2, limit), false);
  assert.equal(isQuotaExceeded(3, limit), true);
  assert.equal(quotaRemaining(2, limit), 1);
  assert.equal(quotaRemaining(3, limit), 0);
  assert.equal(quotaUsagePercent(2, limit), 67);
  assert.equal(quotaUsagePercent(3, limit), 100);
});

test("quota headers expose plan and remaining capacity", () => {
  const headers = quotaResponseHeaders(2, 3, "FREE");
  assert.deepEqual(headers, {
    "X-API-Quota-Limit": "3",
    "X-API-Quota-Remaining": "1",
    "X-API-Quota-Used": "2",
    "X-API-Plan": "FREE",
  });
});
