import assert from "node:assert/strict";
import test from "node:test";
import {
  canIssueApiKey,
  FREE_QUOTA_EXCEEDED_MESSAGE_AR,
  FREE_QUOTA_EXCEEDED_MESSAGE_EN,
  freeQuotaExceededBody,
  isQuotaExceeded,
  quotaRemaining,
  quotaResponseHeaders,
  quotaUsagePercent,
} from "./api-quota";
import { PLAN_DEFINITIONS } from "./plans";

test("free plan quota is account-wide with one key and month/year caps", () => {
  assert.equal(PLAN_DEFINITIONS.FREE.dailyRequests, 3);
  assert.equal(PLAN_DEFINITIONS.FREE.monthlyRequests, 10);
  assert.equal(PLAN_DEFINITIONS.FREE.yearlyRequests, 100);
  assert.equal(PLAN_DEFINITIONS.FREE.maxKeys, 1);
  assert.equal(canIssueApiKey(0, PLAN_DEFINITIONS.FREE.maxKeys), true);
  assert.equal(canIssueApiKey(1, PLAN_DEFINITIONS.FREE.maxKeys), false);
});

test("pro plan allows ten keys sharing one daily pool without month/year caps", () => {
  assert.equal(PLAN_DEFINITIONS.PRO.dailyRequests, 500);
  assert.equal(PLAN_DEFINITIONS.PRO.monthlyRequests, null);
  assert.equal(PLAN_DEFINITIONS.PRO.yearlyRequests, null);
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

test("quota headers expose plan, daily, and free month/year capacity", () => {
  const headers = quotaResponseHeaders({
    plan: "FREE",
    usedToday: 2,
    dailyLimit: 3,
    usedMonth: 9,
    monthlyLimit: 10,
    usedYear: 40,
    yearlyLimit: 100,
  });
  assert.deepEqual(headers, {
    "X-API-Quota-Limit": "3",
    "X-API-Quota-Remaining": "1",
    "X-API-Quota-Used": "2",
    "X-API-Plan": "FREE",
    "X-API-Quota-Month-Limit": "10",
    "X-API-Quota-Month-Used": "9",
    "X-API-Quota-Month-Remaining": "1",
    "X-API-Quota-Year-Limit": "100",
    "X-API-Quota-Year-Used": "40",
    "X-API-Quota-Year-Remaining": "60",
  });
});

test("free quota exceeded body is bilingual and empty of news items", () => {
  const body = freeQuotaExceededBody({
    plan: "FREE",
    window: "month",
    usedToday: 1,
    dailyLimit: 3,
    usedMonth: 10,
    monthlyLimit: 10,
    usedYear: 40,
    yearlyLimit: 100,
  });
  assert.equal(body.error, "quota_exceeded");
  assert.equal(body.message, FREE_QUOTA_EXCEEDED_MESSAGE_EN);
  assert.equal(body.messageAr, FREE_QUOTA_EXCEEDED_MESSAGE_AR);
  assert.deepEqual(body.items, []);
  assert.equal(body.window, "month");
});
