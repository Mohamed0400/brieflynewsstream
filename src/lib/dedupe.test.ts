import assert from "node:assert/strict";
import test from "node:test";
import { dedupeArticles, normalizeStoryText, storyGroupKey, storyKey } from "./dedupe";

test("rate variants in Arabic titles share the same story key", () => {
  const titles = [
    "بنك الكويت المركزي يرفع سعر الخصم إلى 4.25%",
    "بنك الكويت المركزي يرفع سعر الخصم إلى 5.75%",
    "بنك الكويت المركزي يرفع سعر الخصم إلى 5.50%",
  ];
  const keys = titles.map((title) => storyKey(title));
  assert.equal(keys[0], keys[1]);
  assert.equal(keys[1], keys[2]);
  assert.match(normalizeStoryText(titles[0]), /بنك الكويت المركزي يرفع سعر الخصم إلى/);
  assert.doesNotMatch(normalizeStoryText(titles[0]), /\d/);
});

test("dedupeArticles keeps one article per story group", () => {
  const publishedAt = new Date("2026-08-18T08:30:00.000Z");
  const articles = [
    {
      id: "a",
      title: "بنك الكويت المركزي يرفع سعر الخصم إلى 4.25%",
      summary: "summary a",
      publisher: "Central Bank of Kuwait",
      country: "KW",
      category: "FINANCE",
      publishedAt,
      score: { finalScore: 70 },
    },
    {
      id: "b",
      title: "بنك الكويت المركزي يرفع سعر الخصم إلى 5.75%",
      summary: "summary b",
      publisher: "Central Bank of Kuwait",
      country: "KW",
      category: "FINANCE",
      publishedAt,
      score: { finalScore: 72 },
    },
    {
      id: "c",
      title: "Fed keeps rates unchanged",
      summary: "summary c",
      publisher: "Federal Reserve",
      country: "US",
      category: "ECONOMICS",
      publishedAt,
      score: { finalScore: 80 },
    },
  ];

  const deduped = dedupeArticles(articles);
  assert.equal(deduped.length, 2);
  assert.equal(deduped[0].id, "b");
  assert.equal(deduped[1].id, "c");
  assert.equal(
    storyGroupKey(articles[0]),
    storyGroupKey(articles[1]),
  );
});

test("dedupeArticles keeps the newest duplicate when preferRecency is true", () => {
  const newer = new Date("2026-08-28T12:00:00.000Z");
  const older = new Date("2026-08-28T04:00:00.000Z");
  const articles = [
    {
      id: "new",
      title: "Oil prices rise on supply concerns",
      summary: "newer",
      publisher: "Reuters",
      country: "GLOBAL",
      category: "OIL",
      publishedAt: newer,
      score: { finalScore: 40 },
    },
    {
      id: "old",
      title: "Oil prices rise on supply concerns",
      summary: "older",
      publisher: "Reuters",
      country: "GLOBAL",
      category: "OIL",
      publishedAt: older,
      score: { finalScore: 90 },
    },
  ];

  const deduped = dedupeArticles(articles, { preferRecency: true });
  assert.equal(deduped.length, 1);
  assert.equal(deduped[0].id, "new");
});
