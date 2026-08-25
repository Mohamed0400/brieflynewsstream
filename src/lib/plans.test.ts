import assert from "node:assert/strict";
import test from "node:test";
import { PLAN_DEFINITIONS, formatPlanCount, planPriceCents, resolvePlanLimits } from "./plans";
import { pricingCopy } from "./pricing-copy";

test("published plans match the production quota and key gates", () => {
  assert.equal(PLAN_DEFINITIONS.FREE.dailyRequests, 5);
  assert.equal(PLAN_DEFINITIONS.FREE.maxKeys, 2);
  assert.equal(PLAN_DEFINITIONS.FREE.commercialUse, false);
  assert.equal(PLAN_DEFINITIONS.FREE.listPriceMonthlyUsd, 0);
  assert.equal(PLAN_DEFINITIONS.FREE.archiveAccess, "full");

  assert.equal(PLAN_DEFINITIONS.PRO.dailyRequests, 500);
  assert.equal(PLAN_DEFINITIONS.PRO.maxKeys, 10);
  assert.equal(PLAN_DEFINITIONS.PRO.commercialUse, true);
  assert.equal(PLAN_DEFINITIONS.PRO.listPriceMonthlyUsd, 70);

  assert.equal(PLAN_DEFINITIONS.ENTERPRISE.dailyRequests, 20_000);
  assert.equal(PLAN_DEFINITIONS.ENTERPRISE.maxKeys, 100);
  assert.equal(PLAN_DEFINITIONS.ENTERPRISE.commercialUse, true);
  assert.equal(PLAN_DEFINITIONS.ENTERPRISE.listPriceMonthlyUsd, 150);
  assert.equal(planPriceCents("PRO"), 7000);
  assert.equal(planPriceCents("ENTERPRISE"), 15000);
  assert.equal(planPriceCents("FREE"), 0);
});

test("pricing copy quotes the same daily limits the API enforces", () => {
  const en = pricingCopy("en");
  const ar = pricingCopy("ar");
  const proQuota = `${formatPlanCount(PLAN_DEFINITIONS.PRO.dailyRequests)} ${en.featureQuotaUnit}`;
  const entQuota = `${formatPlanCount(PLAN_DEFINITIONS.ENTERPRISE.dailyRequests)} ${en.featureQuotaUnit}`;

  assert.match(en.nextProof, new RegExp(String(PLAN_DEFINITIONS.FREE.dailyRequests)));
  assert.match(en.nextProof, new RegExp(formatPlanCount(PLAN_DEFINITIONS.PRO.dailyRequests)));
  assert.match(ar.nextProof, new RegExp(String(PLAN_DEFINITIONS.FREE.dailyRequests)));
  assert.match(ar.nextProof, new RegExp(formatPlanCount(PLAN_DEFINITIONS.PRO.dailyRequests)));
  assert.equal(proQuota, "500 requests a day");
  assert.equal(entQuota, "20,000 requests a day");
  assert.equal(en.ctaEnterprise, "Start with Enterprise");
  assert.match(en.pageLede, /\$150/);
});

test("account overrides replace the published daily cap", () => {
  const limits = resolvePlanLimits({
    plan: "PRO",
    dailyPointsOverride: 750,
    maxKeysOverride: 12,
  });
  assert.equal(limits.dailyRequests, 750);
  assert.equal(limits.maxKeys, 12);
  assert.equal(limits.commercialUse, true);
});
