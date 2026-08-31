import assert from "node:assert/strict";
import { Region } from "@prisma/client";
import test from "node:test";
import {
  articleBriefPriority,
  compareArticlesForBriefFeed,
  isGlobalBriefArticle,
  shouldApplyBriefRanking,
  sortArticlesForBriefFeed,
} from "./brief-feed-ranking";

test("global and EU stories rank before country-specific markets", () => {
  const global = {
    country: "GLOBAL",
    region: Region.GLOBAL,
    publishedAt: new Date("2026-08-28T08:00:00Z"),
    score: { finalScore: 70 },
  };
  const philippines = {
    country: "PH",
    region: Region.GLOBAL,
    publishedAt: new Date("2026-08-28T09:00:00Z"),
    score: { finalScore: 95 },
  };
  assert.equal(isGlobalBriefArticle(global), true);
  assert.equal(isGlobalBriefArticle(philippines), false);
  assert.ok(compareArticlesForBriefFeed(global, philippines) < 0);
});

test("Gulf editorial order puts Kuwait ahead of Saudi, UAE, and Qatar", () => {
  const kuwait = {
    country: "KW",
    region: Region.MIDDLE_EAST,
    publishedAt: new Date("2026-08-28T10:00:00Z"),
    score: { finalScore: 80 },
  };
  const saudi = {
    country: "SA",
    region: Region.MIDDLE_EAST,
    publishedAt: new Date("2026-08-28T11:00:00Z"),
    score: { finalScore: 90 },
  };
  const uae = {
    country: "AE",
    region: Region.MIDDLE_EAST,
    publishedAt: new Date("2026-08-28T11:30:00Z"),
    score: { finalScore: 88 },
  };
  const qatar = {
    country: "QA",
    region: Region.MIDDLE_EAST,
    publishedAt: new Date("2026-08-28T12:00:00Z"),
    score: { finalScore: 86 },
  };
  const sorted = sortArticlesForBriefFeed([qatar, uae, saudi, kuwait]);
  assert.deepEqual(sorted.map((item) => item.country), ["KW", "SA", "AE", "QA"]);
  assert.equal(articleBriefPriority(kuwait).memberRank, 0);
  assert.ok(articleBriefPriority(kuwait).memberRank < articleBriefPriority(saudi).memberRank);
});

test("brief ranking applies only on the unfiltered impact feed", () => {
  assert.equal(shouldApplyBriefRanking({}), true);
  assert.equal(shouldApplyBriefRanking({ country: "KW" }), false);
  assert.equal(shouldApplyBriefRanking({ category: "oil" }), false);
  assert.equal(shouldApplyBriefRanking({ nationalityCodes: ["KW"] }), false);
  assert.equal(shouldApplyBriefRanking({ q: "gold" }), false);
});
