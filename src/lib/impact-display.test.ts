import assert from "node:assert/strict";
import test from "node:test";
import {
  impactTierFromArticle,
  impactTierFromScore,
  marketImpactRows,
} from "./impact-display";

test("impact tiers map score bands to readable labels", () => {
  assert.equal(impactTierFromScore(82), "high");
  assert.equal(impactTierFromScore(61), "moderate");
  assert.equal(impactTierFromScore(33), "watch");
  assert.equal(impactTierFromScore(8), "low");
});

test("market impact rows expose the three desk markets", () => {
  assert.deepEqual(
    marketImpactRows({ oilImpact: 80, ratesImpact: 40, marketImpact: 65 }),
    [
      { key: "oil", value: 80 },
      { key: "rates", value: 40 },
      { key: "markets", value: 65 },
    ],
  );
});

test("article tier uses the strongest market signal", () => {
  assert.equal(
    impactTierFromArticle({
      finalScore: 42,
      oilImpact: 88,
      ratesImpact: 10,
      marketImpact: 12,
    }),
    "high",
  );
});
